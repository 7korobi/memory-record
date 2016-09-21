_ = require "lodash"

OBJ = ->
  new Object null

each = (from, process)->
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

Mem = module.exports
class Mem.Base.Finder
  constructor: (@model, @sortBy, @orderBy)->
    all = new Mem.Base.Query @, [], @sortBy, @orderBy
    all._memory = OBJ()
    @scope = { all }
    @query = { all }
    @validates = []

  validate: (cb)->
    @validates.push cb

  use_cache: (key, query_call)->
    switch query_call?.constructor
      when Function
        @query.all[key] = (args...)=>
          @query.all["#{key}:#{JSON.stringify args}"] ?= query_call args...
      else
        @query.all[key] = query_call

  rehash: ->
    delete @query.all._reduce
    delete @query.all._list
    delete @query.all._hash
    @query =
      all: @query.all
    return

  calculate: (query)->
    @list query, @query.all._memory
    if query._list.length && @model.map_reduce?
      @reduce query
      if query._distinct?
        @group query
    @sort query
    return

  reduce: (query)->
    init = (map)->
      o = OBJ()
      o.count = 0 if map.count
      o.all   = 0 if map.all
      o.list = [] if map.list
      o.set  = OBJ() if map.set
      o

    reduce = (item, o, map)->
      if map.list
        o.list.push map.list
      if map.set
        o.set[map.set] = true
      unless map.max <= o.max
        o.max_is = item
        o.max = map.max
      unless o.min <= map.min
        o.min_is = item
        o.min = map.min
      o.count += map.count if map.count
      o.all += map.all if map.all

    calc = (o)->
      o.avg = o.all / o.count if o.all && o.count

    # map_reduce
    base = OBJ()
    paths = OBJ()
    for id, {item, emits} of query._memory
      for [path, map] in emits
        o = _.get base, path
        unless o
          o = paths[path.join(".")] = init map 
          _.set base, path, o
          o
        reduce item, o, map
    for path, o of paths
      calc o
    query._reduce = base

  sort: (query)->
    { sortBy, orderBy } = query
    if sortBy?
      query._list =
        if orderBy?
          _.orderBy query._list, sortBy, orderBy
        else
          _.sortBy query._list, sortBy


  group: (query)->
    { reduce, target } = query._distinct
    query._list =
      for id, o of query._reduce[reduce]
        o[target]

  list: (query, all)->
    if query._memory == all
      deploy = (id, o)->
        query._hash[id] = o.item
    else
      query._memory = OBJ()
      deploy = (id, o)->
        query._memory[id] = o
        query._hash[id] = o.item

    query._hash = OBJ()
    query._list =
      for id, o of all
        every = true
        for chk in query.filters when ! chk o.item
          every = false
          break
        continue unless every
        deploy id, o


  remove: (from)->
    { _memory } = @query.all
    each from, (item)=>
      old = _memory[item._id]
      if old?
        @model.delete old
        delete _memory[item._id]
      return
    @rehash()

  reset: (from, parent)->
    { _memory } = @query.all
    @query.all._memory = news = OBJ()
    @merge from, parent

    for key, old of _memory 
      item = news[key]
      if item?
        model.update item, old
      else
        model.delete old
    @rehash()

  merge: (from, parent)->
    { _memory } = @query.all
    each from, (item)=>
      for key, val of parent
        item[key] = val
      item.__proto__ = @model.prototype
      @model.call item, item, @model
      @model.rowid++

      every = true
      for chk in @validates when ! chk item
        every = false
        break

      if every
        o = { item, emits: [] }
        old = _memory[item._id]
        if old?
          @model.update item, old
        else
          @model.create item
        _memory[item._id] = o

        if @model.map_reduce?
          emit = (keys..., cmd)=>
            o.emits.push [keys, cmd]
          @model.map_reduce item, emit
      return
    @rehash()

