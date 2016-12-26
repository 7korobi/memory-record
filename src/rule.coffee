_ = require "lodash"

_rename = {}
rename = (base)->
  id =   "#{base}_id"
  ids =  "#{base}_ids"
  list = "#{base}s"
  _rename[list] = _rename[base] = { id, ids, list, base }

Mem = module.exports

class Mem.Rule
  constructor: (base)->
    @name = rename base
    @depend_on base

    @finder = new Mem.Base.Finder "_id"
    @model = Mem.Base.Model

    @dml = new Mem.Base.Collection @
    @inits = []

  schema: (cb)->
    cb.call @, @dml
    @model.id   = @name.id
    @model.list = @name.list
    if @model == Mem.Base.Model
      class @model extends @model

    for init in @inits
      init()

    Mem.Model[@name.base] = @finder.model = @model
    Mem.Collection[@name.base] = @dml
    Mem.Query[@name.list] = @finder.query.all
    @

  composite: ->
    for f in Mem.Composite[@name.base]
      f()
    return

  depend_on: (parent)->
    Mem.Composite[parent] ?= []
    Mem.Composite[parent].push ->
      Mem.Collection[parent].rule.finder.rehash()

  scope: (cb)->
    @finder.scope = cb @finder.query.all
    for key, query_call of @finder.scope
      @finder.use_cache key, query_call

  relation_to_one: (key, target, ik)->
    @inits.push =>
      Object.defineProperty @model.prototype, key,
        get: ->
          Mem.Query[target].find(@[ik])

  relation_to_many: (key, target, ik, qk)->
    all = @finder.query.all
    @finder.use_cache key, (id)->
      Mem.Query[target].where "#{qk}": id

    @inits.push =>
      Object.defineProperty @model.prototype, key,
        get: ->
          all[key](@[ik])

  relation_tree: (key, ik, qk)->
    all = @finder.query.all
    @finder.use_cache key, (id, n)->
      if n
        q = all.where "#{ik}": id
        for k in q.pluck(qk)
          id.push k
        all[key] _.uniq(id), n - 1
      else
        all.where "#{qk}": id

    @model.prototype[key] = (n)->
      id = [@[qk]]
      all[key] id, n

  relation_graph: (key, ik, qk)->
    all = @finder.query.all
    @finder.use_cache key, (id, n)->
      q = all.where "#{qk}": id
      if n
        for a in q.pluck(ik) when a?
          for k in a when key?
            id.push k

        all[key] _.uniq(id), n - 1
      else
        q

    @model.prototype[key] = (n)->
      all[key] [@[qk]], n

  belongs_to: (to, option = {})->
    name = rename to
    { key = name.id, target = name.list, dependent } = option
    @relation_to_one to, target, key

    if dependent
      @depend_on to
      @finder.validate (o)->
        o[to]?

  has_many: (to, option = {})->
    { key, target = to } = option
    name = rename to
    switch option.by
      when "ids"
        ik = key ? name.ids
        qk = "_id"
      else
        ik = "_id"
        qk = key ? @name.id
    @relation_to_many to, target, ik, qk

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

  shuffle: ->
    query = @finder.query.all.shuffle()
    query._memory = @finder.query.all._memory
    Mem.Query[@name.list] = @finder.query.all = query

  order: (sortBy, orderBy)->
    query = @finder.query.all.sort sortBy, orderBy
    query._memory = @finder.query.all._memory
    Mem.Query[@name.list] = @finder.query.all = query

  protect: (keys...)->
    @protect = (o, old)->
      for key in keys
        o[key] = old[key]

