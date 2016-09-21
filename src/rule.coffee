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

  belongs_to: (parent, option)->
    parents = "#{parent}s"
    parent_id = "#{parent}_id"

    @inits.push =>
      Object.defineProperty @model.prototype, parent,
        get: ->
          Mem.Query[parents].find @[parent_id]

    dependent = option?.dependent
    if dependent
      @depend_on parent
      @finder.validate (o)->
        o[parent]?

  has_many: (children, option)->
    key = @model_id
    all = @finder.query.all
    query = option?.query

    @finder.use_cache children, (id)->
      query ?= Mem.Query[children]
      query.where (o)-> o[key] == id

    @inits.push =>
      Object.defineProperty @model.prototype, children,
        get: ->
          all[children](@._id)

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

