_ = require "lodash"

OBJ = ->
  new Object null

set_for = (list)->
  set = OBJ()
  for key in list
    set[key] = true
  set



Mem = module.exports
class Mem.Base.Query
  constructor: (@finder, @filters, @sortBy, @orderBy)->

  _filters: (query, cb)->
    return @ unless query
    filters = @filters.concat()
    switch query?.constructor
      when Object
        for target, req of query
          filters.push cb target, req
      when Function
        filters.push cb null, query
      else
        console.log [query, query]
        throw Error 'unimplemented'
    new Query @finder, filters, @orderBy

  in: (query)->
    @_filters query, (target, req)->
      switch req?.constructor
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
          console.log [req, req]
          throw Error 'unimplemented'

  distinct: (reduce, target)->
    query = new Query @finder, @filters, @orderBy
    query._distinct = {reduce, target}
    query

  where: (query)->
    @_filters query, (target, req)->
      switch req?.constructor
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

  sort: (sortBy, orderBy)->
    return @ if _.isEqual [sortBy, orderBy], [@sortBy, @orderBy]
    new Query @finder, @filters, sortBy, orderBy

  shuffle: ->
    new Query @finder, @filters, Math.random

  clear: ->
    delete @_reduce
    delete @_list
    delete @_hash
    delete @_memory

  save: ->
    @finder.save(@)

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
          [a] = _.at o, keys
          a
      else
        @list.map (o)->
          _.at o, keys

  Object.defineProperties @.prototype,
    reduce:
      get: ->
        @finder.calculate(@) unless @_reduce?
        @_reduce

    list:
      get: ->
        @finder.calculate(@) unless @_list?
        @_list

    hash:
      get: ->
        @finder.calculate(@) unless @_hash?
        @_hash

    memory:
      get: ->
        @finder.calculate(@) unless @_memory?
        @_memory

    ids:
      get: ->
        Object.keys @memory


