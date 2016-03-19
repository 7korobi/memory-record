type = (o)->
  o?.constructor

def = (obj, key, { get, set })->
  configurable = false
  enumerable = false
  Object.defineProperty obj, key, { configurable, enumerable, get, set }
  return

set_for = (list)->
  set = {}
  for key in list
    set[key] = true
  set



Mem = module.exports
class Mem.Query
  constructor: (@finder, @filters, @desc, @sort_by)->

  _filters: (query, cb)->
    return @ unless query
    filters = @filters.concat()
    switch type query
      when Object
        for target, req of query
          filters.push cb target, req
      when Function
        filters.push cb null, query
      else
        console.log [type query, query]
        throw Error 'unimplemented'
    new Query @finder, filters, @desc, @sort_by

  in: (query)->
    @_filters query, (target, req)->
      switch type req
        when Array
          (o)->
            set = set_for o[target]
            for key in req
              return true if set[key]
            false
        when RegExp
          (o)->
            for val in o[target]
              return true if req.test val
            false
        when null, Boolean, String, Number
          (o)->
            set = set_for o[target]
            set[req]
        else
          console.log [type req, req]
          throw Error 'unimplemented'

  distinct: (reduce, target)->
    query = new Query @finder, @filters, @desc, @sort_by
    query._distinct = {reduce, target}
    query

  where: (query)->
    @_filters query, (target, req)->
      switch type req
        when Array
          set = set_for req
          (o)->
            set[ o[target] ]
        when RegExp
          (o)-> req.test o[target]
        when Function
          req
        when null, Boolean, String, Number
          (o)-> o[target] == req
        else
          console.log [type req, req]
          throw Error 'unimplemented'

  search: (text)->
    return @ unless text
    list =
      for item in text.split(/\s+/)
        item = item.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        continue unless item.length
        "(#{item})"
    return @ unless list.length
    regexp = (new RegExp list.join("|"), "ig")
    @where (o)-> (! o.search_words) || regexp.test o.search_words

  sort: (desc, order = @sort_by)->
    sort_by =
      switch type order
        when Function
          order
        when String, Number
          (o)-> o[order]
        else
          console.log [type req, req]
          throw Error 'unimplemented'
    return @ if desc == @desc && sort_by == @sort_by
    new Query @finder, @filters, desc, sort_by

  shuffle: ->
    new Query @finder, @filters, false, Math.random

  clear: ->
    delete @_reduce
    delete @_list
    delete @_hash
    delete @_memory

  save: ->
    @finder.save(@)

  fetch: ->
    @

  def @.prototype, "reduce",
    get: ->
      @finder.calculate(@) unless @_reduce?
      @_reduce

  def @.prototype, "list",
    get: ->
      @finder.calculate(@) unless @_list?
      @_list

  def @.prototype, "hash",
    get: ->
      @finder.calculate(@) unless @_hash?
      @_hash

  def @.prototype, "memory",
    get: ->
      @finder.calculate(@) unless @_memory?
      @_memory

  def @.prototype, "ids",
    get: ->
      Object.keys @memory

  find: (id)->
    @hash[id]

  finds: (ids)->
    for id in ids when o = @hash[id]
      o

  pluck: (keys...)->
    switch keys.length
      when 0
        @list.map -> null
      when 1
        @list.map (o)->
          o[keys[0]]
      else
        @list.map (o)->
          for key in keys
            o[key]
