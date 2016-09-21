
OBJ = ->
  new Object null

f_set = (list, parent)->
  { finder, model } = @rule
  { _memory } = finder.query.all
  finder.query.all._memory = OBJ()
  @set_base "merge", list, parent

  for key, old of _memory 
    item = finder.query.all._memory[key]
    if item?
      model.update item, old
    else
      model.delete old

f_merge = (list, parent)->
  @set_base "merge", list, parent

f_remove = (list)->
  @set_base false, list, null

f_item = (cb)->
  (item, parent)->
    cb.call @, [item], parent

f_composite = ->
  @rule.composite()

Mem = module.exports
class Mem.Base.Collection
  set:   f_set
  reset: f_set

  merge:  f_merge

  reject: f_remove

  add:    f_item f_merge
  append: f_item f_merge
  create: f_item f_merge
  remove: f_item f_remove

  clear_cache: f_composite
  refresh:     f_composite
  rehash:      f_composite

  constructor: (@rule)->
    @validates = []

  set_base: (mode, from, parent)->
    { finder, model } = @rule
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
          item.__proto__ = model.prototype
          model.call item, item, model

          every = true
          for chk in @validates when ! chk item
            every = false
            break

          if every
            o = { item, emits: [] }
            old = all[item._id]
            if old?
              model.update item, old
            else
              model.create item
            all[item._id] = o

            if finder.map_reduce
              emit = (keys..., cmd)=>
                o.emits.push [keys, cmd]
              model.map_reduce item, emit
          return
      else
        each (item)=>
          old = all[item._id]
          if old?
            model.delete old
            delete all[item._id]
          return

    @clear_cache()
    return
