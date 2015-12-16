typeof_str = Object.prototype.toString
type = (o)->
  typeof_str.call(o)[8..-2]

def = (obj, key, {get, set})->
  configurable = false
  enumerable = false
  Object.defineProperty obj, key, {configurable, enumerable, get, set}
  return


class @Mem
  @rule = {}
