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

  _filters: (req, cb)->
    return @ unless req
    filters = @filters.concat()
    type = req?.constructor
    switch type
      when Object
        for target, req of req
          path = _.property target
          filters.push cb path, req
      when Function, Array, String
        path = (o)-> o
        filters.push cb path, req
      else
        console.log [type, req]
        throw Error 'unimplemented'
    new Query @finder, filters, @orderBy

  in: (req)->
    @_filters req, (path, req)->
      type = req?.constructor
      switch type
        when Array
          set = set_for req
          (o)->
            for key in path o
              return true if set[key]
            false
        when RegExp
          (o)->
            for val in path o
              return true if req.test val
            false
        when null, Boolean, String, Number
          (o)->
            set = set_for path o
            set[req]
        else
          console.log [type, req]
          throw Error 'unimplemented'

  where: (req)->
    @_filters req, (path, req)->
      type = req?.constructor
      switch type
        when Function
          req
        when Array
          set = set_for req
          (o)-> set[ path o ]
        when RegExp
          (o)-> req.test path o
        when null, Boolean, String, Number
          (o)-> req == path o
        else
          console.log [type, req]
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

  distinct: (reduce, target)->
    query = new Query @finder, @filters, @orderBy
    query._distinct = {reduce, target}
    query

  sort: (sortBy, orderBy)->
    return @ if _.isEqual [sortBy, orderBy], [@sortBy, @orderBy]
    console.warn [sortBy, orderBy]
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


