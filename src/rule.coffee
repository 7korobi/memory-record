type = (o)->
  o?.constructor

cache_scope = (key, finder, query_call)->
  switch query_call?.constructor
    when Function
      finder.query.all[key] = (args...)->
        finder.query["#{key}:#{JSON.stringify args}"] ?= query_call args...
    else
      finder.query.all[key] = query_call


Mem = module.exports

class base_model
  constructor: (o, m)->
    o._id = o[m.id] unless o._id
    o[m.id] = o._id unless o[m.id]


class Mem.Rule
  @responses = {}

  f_set = (list, parent)->
    @finder.diff = {}
    for key, val of @finder.query.all._memory
      @finder.query.all._memory = {}
      @finder.diff.del = true
      break
    @set_base "merge", list, parent

  f_merge = (list, parent)->
    @finder.diff = {}
    @set_base "merge", list, parent

  f_remove = (list)->
    @finder.diff = {}
    @set_base false, list, null

  f_item = (cb)->
    (item, parent)->
      switch type item
        when Object
          cb.call @, [item], parent
        else
          throw Error 'invalid data : #{item}'

  set:   f_set
  reset: f_set

  merge:  f_merge

  reject: f_remove

  add:    f_item f_merge
  create: f_item f_merge
  remove: f_item f_remove

  constructor: (field)->
    @model_id   = "#{field}_id"
    @model_list = "#{field}s"
    @validates = []
    @responses = Mem.Rule.responses[field] ?= []
    @map_reduce = ->
    @protect = ->
    @finder = new Mem.Finder ["_id"], ["asc"]

    Mem.Collection[field] = @
    Mem.Query[@model_list] = @finder.query.all

  schema: (cb)->
    model_deploy = []
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

        model_deploy.push =>
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

        model_deploy.push =>
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

      map_reduce: (@map_reduce)=>

      model: base_model

    cb.call(definer, @)
    @model = definer.model
    @model.id   = @model_id
    @model.list = @model_list
    if definer.model == base_model
      class @model extends @model
    for deploy in model_deploy
      deploy()

  rehash: (diff)->
    @finder.rehash @responses, diff


  set_base: (mode, from, parent)->
    finder = @finder
    diff = finder.diff
    all = finder.query.all._memory

    deployer = (o)=>
      o.__proto__ = @model.prototype
      @model.call o, o, @model

    validate_item = (item)=>
      for validate in @validates
        return false unless validate item
      true

    each = (process)->
      switch type from
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

          deployer item
          return unless validate_item item

          o = {item, emits: []}
          old = all[item._id]
          if old?
            @protect item, old.item
            diff.change = true
          else
            diff.add = true
          all[item._id] = o

          emit = (keys..., last, map)=>
            finder.map_reduce = true
            o.emits.push [keys, last, map]
          @map_reduce o.item, emit
          return

      else
        each (item)=>
          old = all[item._id]
          if old?
            diff.del = true
            delete all[item._id]
          return

    @rehash(diff)
    return
