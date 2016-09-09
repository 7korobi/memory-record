Mem = module.exports
class Mem.Finder
  constructor: (@sort_by)->
    all = new Mem.Query @, [], "asc", @sort_by
    all._memory = {}
    @scope = {all}
    @query = {all}

  rehash: (rules, diff)->
    delete @query.all._reduce
    delete @query.all._list
    delete @query.all._hash
    @query =
      all: @query.all

    for rule in rules
      rule.rehash diff
    return

  calculate_reduce: (query)->
    init = (map)->
      o = {}
      o.count = 0 if map.count
      o.all   = 0 if map.all
      o.push = [] if map.push
      o.set  = {} if map.set
      o

    reduce = (item, o, map)->
      if map.push
        o.push.push map.push
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
    for id, {item, emits} of query._memory
      for [keys, last, map] in emits
        o = base
        for key in keys
          o = o[key] ||= {}
        o = o[last] ||= init map
        reduce item, o, map

    for group, emits of base
      for key, map of emits
        calc map
    query._reduce = base

  calculate_sort: (query)->
    query._list = query._list.sortBy query.type, query.sort_by

  calculate_group: (query)->
    {reduce, target} = query._distinct
    query._list =
      for id, o of query._reduce[reduce]
        o[target]

  calculate_list: (query, all)->
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
        for filters in query.filters
          o = null unless filters o.item
          break unless o
        continue unless o
        deploy(id, o)

  calculate: (query)->
    @calculate_list query, @query.all._memory
    if query._list.length && @map_reduce?
      @calculate_reduce query
      if query._distinct?
        @calculate_group query
    @calculate_sort query
    return
