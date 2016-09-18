# configurable: false
# enumerable: false
# writable: false
# value: undefined
# get: undefined
# set: undefined
Object.defineProperties Number.prototype,
  times:
    get: ->
      [0...@]
