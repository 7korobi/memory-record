
Mem = module.exports
class Mem.Base.Model
  @rowid = 0
  @update: (item, old)->
  @create: (item)->
  @delete: (old)->

  constructor: (m)->
    @_id = @[m.id] unless @_id
    @[m.id] = @_id unless @[m.id]

