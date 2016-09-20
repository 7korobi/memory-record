_ = require "lodash"

Mem = module.exports
class Mem.Finder
  constructor: (@sortBy, @orderBy)->
    all = new Mem.Query @, [], @sortBy, @orderBy
    all._memory = {}
    @scope = { all }
    @query = { all }

  rehash: (rules)->
    delete @query.all._reduce
    delete @query.all._list
    delete @query.all._hash
    @query =
      all: @query.all

    for rule in rules
      rule.rehash()
    return

  _reduce: (query)->
    init = (map)->
      o = {}
      o.count = 0 if map.count
      o.all   = 0 if map.all
      o.list = [] if map.list
      o.set  = {} if map.set
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
    base = {}
    paths = {}
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

  _sort: (query)->
    { sortBy, orderBy } = query
    if sortBy?
      query._list =
        if orderBy?
          _.orderBy query._list, sortBy, orderBy
        else
          _.sortBy query._list, sortBy


  _group: (query)->
    {reduce, target} = query._distinct
    query._list =
      for id, o of query._reduce[reduce]
        o[target]

  _list: (query, all)->
    if query._memory == all
      deploy = (id, o)->
        query._hash[id] = o.item
    else
      query._memory = {}
      deploy = (id, o)->
        query._memory[id] = o
        query._hash[id] = o.item

    query._hash = {}
    query._list =
      for id, o of all
        every = true
        for chk in query.filters when ! chk o.item
          every = false
          break
        continue unless every
        deploy id, o

  calculate: (query)->
    @_list query, @query.all._memory
    if query._list.length && @map_reduce?
      @_reduce query
      if query._distinct?
        @_group query
    @_sort query
    return
