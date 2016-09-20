_ = require "lodash"

cache_scope = (key, finder, query_call)->
  switch query_call?.constructor
    when Function
      finder.query.all[key] = (args...)->
        finder.query["#{key}:#{JSON.stringify args}"] ?= query_call args...
    else
      finder.query.all[key] = query_call


f_set = (list, parent)->
  @finder.diff = {}
  for key, val of @finder.query.all._memory
    @finder.query.all._memory = {}
    break
  @set_base "merge", list, parent

f_merge = (list, parent)->
  @set_base "merge", list, parent

f_remove = (list)->
  @set_base false, list, null

f_item = (cb)->
  (item, parent)->
    cb.call @, [item], parent

rehash = ->
  @finder.rehash @responses


Mem = module.exports

class Mem.Rule
  @responses: {}
  class @Model
    @update: (item, old)->
    @create: (item)->
    @delete: (old)->

    constructor: (o, m)->
      o._id = o[m.id] unless o._id
      o[m.id] = o._id unless o[m.id]

  set:   f_set
  reset: f_set

  merge:  f_merge

  reject: f_remove

  add:    f_item f_merge
  append: f_item f_merge
  create: f_item f_merge
  remove: f_item f_remove

  clear_cache: rehash
  refresh:     rehash
  rehash:      rehash

  constructor: (@field)->
    @model_id   = "#{@field}_id"
    @model_list = "#{@field}s"

  schema: (cb)->
    @responses = Mem.Rule.responses[@field] ?= []
    @finder = new Mem.Finder "_id"
    deploys = []
    @validates = []

    definer =
      scope: (cb)=>
        @finder.scope = cb @finder.query.all
        for key, query_call of @finder.scope
          cache_scope(key, @finder, query_call)

      depend_on: (parent)=>
        Mem.Rule.responses[parent] ?= []
        Mem.Rule.responses[parent].push @

      belongs_to: (parent, option)=>
        parents = "#{parent}s"
        parent_id = "#{parent}_id"

        deploys.push =>
          Object.defineProperty @model.prototype, parent,
            get: ->
              Mem.Query[parents].find @[parent_id]

        dependent = option?.dependent
        if dependent
          definer.depend_on parent
          @validates.push (o)->
            o[parent]?

      has_many: (children, option)=>
        key = @model_id
        all = @finder.query.all
        query = option?.query

        cache_scope children, @finder, (id)->
          query ?= Mem.Query[children]
          query.where (o)-> o[key] == id

        deploys.push =>
          Object.defineProperty @model.prototype, children,
            get: ->
              all[children](@._id)

      shuffle: ->
        query = @finder.query.all.shuffle()
        query._memory = @finder.query.all._memory
        Mem.Query[@model_list] = @finder.query.all = query

      order: (sortBy, orderBy)=>
        query = @finder.query.all.sort sortBy, orderBy
        query._memory = @finder.query.all._memory
        Mem.Query[@model_list] = @finder.query.all = query

      protect: (keys...)=>
        @protect = (o, old)->
          for key in keys
            o[key] = old[key]

      model: Mem.Rule.Model

    cb.call(definer, @)
    @model = definer.model
    @model.id   = @model_id
    @model.list = @model_list
    if definer.model == Mem.Rule.Model
      class @model extends @model
    for deploy in deploys
      deploy()

    Mem.Model[@field] = @model
    Mem.Collection[@field] = @
    Mem.Query[@model_list] = @finder.query.all
    @

  set_base: (mode, from, parent)->
    finder = @finder
    finder.map_reduce = @model.map_reduce?
    all = finder.query.all._memory

    each = (process)->
      switch from?.constructor
        when Array
          for item in from || []
            continue unless item
            process(item)
        when Object
          for id, item of from || {}
            continue unless item
            item._id = id
            process(item)
      return

    switch mode
      when "merge"
        each (item)=>
          for key, val of parent
            item[key] = val
          item.__proto__ = @model.prototype
          @model.call item, item, @model

          every = true
          for chk in @validates when ! chk item
            every = false
            break

          if every
            o = { item, emits: [] }
            old = all[item._id]
            if old?
              @model.update item, old
            else
              @model.create item
            all[item._id] = o

            if finder.map_reduce
              emit = (keys..., cmd)=>
                o.emits.push [keys, cmd]
              @model.map_reduce item, emit
          return
      else
        each (item)=>
          old = all[item._id]
          if old?
            @model.delete old
            delete all[item._id]
          return

    @rehash()
    return
