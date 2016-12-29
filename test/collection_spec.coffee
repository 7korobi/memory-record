assert = require "power-assert"
{ Collection, Query, Rule } = require("../memory-record.js")

describe "Collection", ()->
  new Rule "col_obj",  ->
    @order "_id"
  dml = Collection.col_obj

  it "data refresh", ->
    dml.clear_cache()
    dml.refresh()
    dml.rehash()

  it "data set methods", ->
    dml.reset [
      { _id: 10 }
      { _id: 30 }
    ]
    assert.deepEqual Query.col_objs.ids, [10, 30]

    dml.set [
      { _id: 20 }
    ]
    assert.deepEqual Query.col_objs.ids, [20]

  it "data append methods", ->
    dml.set [
      { _id: 20 }
    ]
    dml.merge [
      { _id: 40 }
      { _id: 50 }
    ]
    assert.deepEqual Query.col_objs.ids, [20, 40, 50]

    dml.add
      _id: 60
    assert.deepEqual Query.col_objs.ids, [20, 40, 50, 60]

    dml.append
      _id: 70
    assert.deepEqual Query.col_objs.ids, [20, 40, 50, 60, 70]

    dml.create
      _id: 80
    assert.deepEqual Query.col_objs.ids, [20, 40, 50, 60, 70, 80]

  it "data set & append for hash data", ->
    dml.set
      10: {}
      20: {}
    assert.deepEqual Query.col_objs.ids, [10, 20]

    dml.merge
      100: {}
      110: {}
      120: {}
    assert.deepEqual Query.col_objs.ids, [10, 20, 100, 110, 120]

  it "remove methods", ->
    dml.set
      10:  {}
      20:  {}
      100: {}
      110: {}
      120: {}
    dml.reject [
      { _id: 100 }
      { _id: 110 }
    ]
    assert.deepEqual Query.col_objs.ids, [10, 20, 120]

    dml.remove
      _id: 120
    assert.deepEqual Query.col_objs.ids, [10, 20]

  it "remove without data", ->
    dml.set
      10:  {}
      20:  {}
    dml.remove
      _id: 999
    assert.deepEqual Query.col_objs.ids, [10, 20]

  it "add bad data", ->
    assert.throws ->
      dml.set "bad data"
    assert.throws ->
      dml.set
        10: "bad data 2"
        20: "bad data 3"

