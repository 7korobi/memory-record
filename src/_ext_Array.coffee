
{ sort } = []

# configurable: false
# enumerable: false
# writable: false
# value: undefined
# get: undefined
# set: undefined
Object.defineProperties Array.prototype,
  first:
    get: -> @[0]

  last:
    get: -> @[@length - 1]

  cycle:
    value: (n)->
      for idx in [0..n]
        @[idx % @length]





