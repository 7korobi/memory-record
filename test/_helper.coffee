global.assert = require "power-assert"

chomp_obj = (base, obj, a, b)->
  return unless a
  switch b?.constructor
    when Object
      obj[base] = {}
      for key, bb of b when a
        chomp_obj key, obj[base], a[key], bb
    when Array
      obj[base] = []
      for bb, idx in b when a
        chomp_obj idx, obj[base], a[idx], bb
    else
      obj[base] = a
  obj

global.assert_only = (val, expect)->
  { value } = chomp_obj "value", {}, val, expect
  assert.deepEqual value, expect
