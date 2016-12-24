_ = require "lodash"


Mem = module.exports

class Mem.Rule
  constructor: (@field)->
    @model_id   = "#{@field}_id"
    @model_list = "#{@field}s"
    @depend_on @field

    @finder = new Mem.Base.Finder "_id"
    @model = Mem.Base.Model

    @dml = new Mem.Base.Collection @
    @inits = []

  schema: (cb)->
    cb.call @, @dml
    @model.id   = @model_id
    @model.list = @model_list
    if @model == Mem.Base.Model
      class @model extends @model

    for init in @inits
      init()

    Mem.Model[@field] = @finder.model = @model
    Mem.Collection[@field] = @dml
    Mem.Query[@model_list] = @finder.query.all
    @

  composite: ->
    for f in Mem.Composite[@field]
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
    { key = "#{to}_id", target = "#{to}s", dependent } = option
    @relation_to_one to, target, key

    if dependent
      @depend_on to
      @finder.validate (o)->
        o[to]?

  has_many: (to, option = {})->
    { key, target = to } = option
    switch option.by
      when "ids"
        ik = key ? to.replace /s$/, "_ids"
        qk = "_id"
      else
        ik = "_id"
        qk = key ? @model_id
    @relation_to_many to, target, ik, qk

  tree: (option={})->
    { key = @model_id } = option
    @relation_tree "nodes", key, "_id"

  graph: (option={})->
    { key, directed, cost } = option
    ik = key ? @model_list.replace /s$/, "_ids"
    @relation_to_many @model_list, @model_list, ik, "_id"
    @relation_graph "path", ik, "_id"

  shuffle: ->
    query = @finder.query.all.shuffle()
    query._memory = @finder.query.all._memory
    Mem.Query[@model_list] = @finder.query.all = query

  order: (sortBy, orderBy)->
    query = @finder.query.all.sort sortBy, orderBy
    query._memory = @finder.query.all._memory
    Mem.Query[@model_list] = @finder.query.all = query

  protect: (keys...)->
    @protect = (o, old)->
      for key in keys
        o[key] = old[key]

