Math.permutation = (gen)->
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
