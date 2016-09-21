
OBJ = ->
  new Object null

f_reset = (list, parent)->
  @rule.finder.reset list, parent

f_merge = (list, parent)->
  @rule.finder.merge list, parent

f_remove = (list)->
  @rule.finder.remove list

f_item = (cb)->
  (item, parent)->
    cb.call @, [item], parent

f_composite = ->
  @rule.finder.rehash()

Mem = module.exports
class Mem.Base.Collection
  set:    f_reset
  reset:  f_reset

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

