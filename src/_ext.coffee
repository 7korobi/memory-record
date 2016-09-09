
{ sort } = []

scanner = (cb)->
  switch cb?.constructor
    when Function
      cb
    when String
      accessor = cb.split "."
      (o)->
        for key in accessor
          o = o[key]
        o
    else
      throw "not supported. scanner"

sort_method = (orders, o, type = "asc")->
  switch type
    when "asc"
      ok = -1
      ng =  1
    when "desc"
      ok =  1
      ng = -1
    else
      throw "not supported. sort_method1 #{type}"

  sort_at = (a, b)->
    return ok if a < b
    return ng if a > b
    return 0

  switch o?.constructor
    when Object
      throw "not supported. sort_method3 #{JSON.stringify o}"
    when Array
      switch o[0]?.constructor
        when Array, Object
          throw "not supported. sort_method2 #{o[0]}"
      (a, b)->
        as = orders[a]
        bs = orders[b]
        for a_at, idx in as
          b_at = bs[idx]
          diff = sort_at a_at, b_at
          return diff if diff
        return 0
    else
      (a, b)->
        a_at = orders[a]
        b_at = orders[b]
        sort_at a_at, b_at


sort_do = (type, orders, values)->
  sort.call [0 ... values.length], sort_method orders, orders[0], type
  .map (idx)->
    values[idx]


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

  choice:
    get: ->
      idx = Math.floor Math.random() * @length
      @[idx]

  shuffle:
    value: ->
      @sortBy (o)-> Math.random()

  sort:
    value: (type)->
      switch type
        when "asc", "desc"
          sort_do type, @, @
        else
          sort.call @, type

  sortBy:
    value: (args..., cb)->
      [type] = args
      cb = scanner cb
      orders = for o in @
        cb o
      sort_do type, orders, @

  permutation:
    value: (gen)->
      combinations = []
      products = []
      shuffles = []
      zips = []
      gen.call
        repeated_combination: (n, list...)->
          combinations.push n
          @product list

        combination: (n, list...)->
          combinations.push n
          @product list

        product: (list...)->
          products.push list

        shuffle: (list...)->
          shuffles.push list

        zip: (list...)->
          zips.push list


      zip_idx = 0
      zip_max = Math.max zips.map (o)-> o.length
      products_val = []
      product_roop = (idx, result = [])->
        return unless products[idx]
        for item in products[idx]

          return result if zip_max && zip_max < zip_idx

          repeated = products_val[idx - 1] == item
          continue if repeated && repeat_check

          products_val[idx] = item
          continue if product_roop idx + 1, result

          zips_val     = zips.map     (o)-> o[zip_idx]
          shuffles_val = shuffles.map (o)-> o.choice

          zip_idx++
          combination_at = 0
          product_at = 0
          shuffle_at = 0
          zip_at = 0
          result.push gen.call
            repeated_combination: ->
              n = combinations[combination_at++]
              for idx in [0 .. n]
                @product()

            combination: ->
              n = combinations[combination_at++]
              for idx in [0 .. n]
                @product()

            product: ->
              products_val[product_at++]

            shuffle: ->
              shuffles_val[shuffle_at++]

            zip: ->
              zips_val[zip_at++]

        result
      product_roop 0

class PermutationManager
  constructor: ->
    @list = []






