typeof_str = Object.prototype.toString
type = (o)->
  typeof_str.call(o)[8..-2]

def = (obj, key, {get, set})->
  configurable = false
  enumerable = false
  Object.defineProperty obj, key, {configurable, enumerable, get, set}
  return


class @Mem.Rule
  @responses = {}

  constructor: (field)->
    @id = "#{field}_id"
    @list_name = "#{field}s"
    @base_obj = {}
    @validates = []
    @responses = Mem.Rule.responses[field] ?= []
    @map_reduce = ->
    @protect = ->
    @deploy = (o)=>
      o._id = o[@id] unless o._id
      o[@id] = o._id unless o[@id]
    @finder = new Mem.Finder (list)-> list
    @finder.name = @list_name

    Mem.rule[field] = @
    Mem[@list_name] = @finder.query.all

  schema: (cb)->
    cache_scope = (key, finder, query_call)->
      switch type query_call
        when "Function"
          finder.query.all[key] = (args...)->
            finder.query["#{key}:#{JSON.stringify args}"] ?= query_call args...
        else
          finder.query.all[key] = query_call

    definer =
      scope: (cb)=>
        @finder.scope = cb @finder.query.all
        for key, query_call of @finder.scope
          cache_scope(key, @finder, query_call)

      default: (cb)=>
        for key, val of cb()
          @base_obj[key] = val

      depend_on: (parent)=>
        Mem.Rule.responses[parent] ?= []
        Mem.Rule.responses[parent].push @

      belongs_to: (parent, option)=>
        parents = "#{parent}s"
        parent_id = "#{parent}_id"

        def @base_obj, parent,
          get: ->
            Mem[parents].find @[parent_id]

        dependent = option?.dependent?
        if dependent
          definer.depend_on parent
          @validates.push (o)-> o[parent]?

      has_many: (children, option)=>
        key = @id
        all = @finder.query.all
        query = option?.query

        cache_scope children, @finder, (id)->
          query ?= Mem[children]
          query.where (o)-> o[key] == id

        def @base_obj, children,
          get: ->
            all[children](@._id)

      order: (order)=>
        query = @finder.query.all.sort false, order
        query._memory = @finder.query.all._memory
        Mem[@list_name] = @finder.query.all = query

      protect: (keys...)=>
        @protect = (o, old)->
          for key in keys
            o[key] = old[key]

      deploy: (@deploy)=>
      map_reduce: (@map_reduce)=>

    cb.call(definer, @)

  rehash: (diff)->
    @finder.rehash @responses, diff


  set_base: (mode, from, parent)->
    finder = @finder
    diff = finder.diff
    all = finder.query.all._memory

    deployer =
      (o)=>
        o.__proto__ = @base_obj
        @deploy o

    validate_item = (item)=>
      for validate in @validates
        return false unless validate item
      true

    each = (process)->
      switch type from
        when "Array"
          for item in from || []
            continue unless item
            process(item)
        when "Object"
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

  set: (list, parent)->
    @finder.diff = {}
    for key, val of @finder.query.all._memory
      @finder.query.all._memory = {}
      @finder.diff.del = true
      break
    @set_base "merge", list, parent

  reject: (list)->
    @finder.diff = {}
    @set_base false, list, null

  merge: (list, parent)->
    @finder.diff = {}
    @set_base "merge", list, parent
