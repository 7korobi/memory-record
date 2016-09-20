
Mem = module.exports
class Mem.Base.Model
  @update: (item, old)->
  @create: (item)->
  @delete: (old)->

  constructor: (o, m)->
    o._id = o[m.id] unless o._id
    o[m.id] = o._id unless o[m.id]

