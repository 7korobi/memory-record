_ = require "lodash"

_rename = {}
rename = (base)->
  name = _rename[base]
  return name if name

  id =   "#{base}_id"
  ids =  "#{base}_ids"
  list = "#{base}s"
  _rename[base] = { id, ids, list, base }

Mem = module.exports

class Mem.Rule
  constructor: (base, cb)->
    @name = rename base
    @depend_on base

    @finder = new Mem.Base.Finder "_id"
    @model = Mem.Base.Model

    @dml = new Mem.Base.Collection @
    @property = {}
    @schema cb if cb
    return

  schema: (cb)->
    cb.call @, @dml

    if @model == Mem.Base.Model
      class @model extends @model
    @model.id   = @name.id
    @model.list = @name.list
    Object.defineProperties @model.prototype, @property

    @finder.validates.unshift @model.validate if @model.validate
    Mem.Model[@name.base] = @finder.model = @model
    Mem.Collection[@name.base] = @dml
    Mem.Query[@name.list] = @finder.all
    @

  composite: ->
    for f in Mem.Composite[@name.base]
      f()
    return

  depend_on: (parent)->
    Mem.Composite[parent] ?= []
    Mem.Composite[parent].push ->
      Mem.Collection[parent].rule.finder.rehash()

  scope_deploy: ->
    for key, query_call of @finder.scope
      @finder.use_cache key, query_call

  scope: (cb)->
    @finder.scope = cb @finder.all
    @scope_deploy()

  default_scope: (scope)->
    old = @finder.all
    Mem.Query[@name.list] = @finder.all = all = scope old
    all._memory = old._memory
    @scope_deploy()

  shuffle: ->
    @default_scope (all)-> all.shuffle()
  order: (sortBy, orderBy)->
    @default_scope (all)-> all.sort sortBy, orderBy
  sort: (sortBy)->
    @default_scope (all)-> all.sort sortBy

  relation_to_one: (key, target, ik)->
    @property[key] =
      enumerable: true
      get: ->
        Mem.Query[target].find(@[ik])

  relation_to_many: (key, target, ik, qk)->
    all = @finder.all
    @finder.use_cache key, (id)->
      Mem.Query[target].where "#{qk}": id

    @property[key] =
      enumerable: true
      get: ->
        all[key](@[ik])

  relation_tree: (key, ik, qk)->
    all = @finder.all
    @finder.use_cache key, (id, n)->
      if n
        q = all.where "#{ik}": id
        for k in q.pluck(qk)
          id.push k
        all[key] _.uniq(id), n - 1
      else
        all.where "#{qk}": id

    @property[key] =
      enumerable: true
      value: (n)->
        id = [@[qk]]
        all[key] id, n

  relation_graph: (key, ik, qk)->
    all = @finder.all
    @finder.use_cache key, (id, n)->
      q = all.where "#{qk}": id
      if n
        for a in q.pluck(ik) when a?
          for k in a when key?
            id.push k

        all[key] _.uniq(id), n - 1
      else
        q

    @property[key] =
      enumerable: true
      value: (n)->
        all[key] [@[qk]], n

  belongs_to: (to, option = {})->
    name = rename to
    { key = name.id, target = name.list, dependent } = option
    @relation_to_one name.base, target, key

    if dependent
      path = _.property to
      @depend_on to
      @finder.validate path

  has_many: (to, option = {})->
    name = rename to.replace /s$/, ""
    { key, target = name.list } = option
    switch option.by
      when "ids"
        ik = key ? name.ids
        qk = "_id"
      else
        ik = "_id"
        qk = key ? @name.id
    @relation_to_many name.list, target, ik, qk

  tree: (option={})->
    @relation_tree "nodes", @name.id, "_id"
    @belongs_to @name.base, option

  graph: (option={})->
    { directed, cost } = option
    ik = @name.ids
    @relation_to_many @name.list, @name.list, ik, "_id"
    @relation_graph "path", ik, "_id"
    unless directed
      true # todo
