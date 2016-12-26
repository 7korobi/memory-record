{ Collection, Query, Rule } = require("../memory-record.js")
_ = require "lodash"

describe "relation", ()->
  it "set", ->
    new Rule("base").schema ->
      @order "_id"
      @graph directed: true
      @tree()
      @has_many "tests"
      @has_many "tags", by: "ids"

    new Rule("test").schema ->
      @belongs_to "base", dependent: true

    new Rule("tag").schema ->

    Collection.tag.set
      a: {}
      b: {}
      c: {}
      d: {}

    Collection.base.set [
      _id: 100
      base_id: 400
      base_ids: [ 200, 300]
      tag_ids: ["a"]
    ,
      _id: 200
      base_id: 100
      tag_ids: ["b"]
    ,
      _id: 300
      base_id: 100
      tag_ids: ["c"]
    ,
      _id: 400
      base_id: 500
      base_ids: [ 100, 300]
      tag_ids: ["a", "d"]
    ,
      _id: 500
      base_ids: [ 400, 300]
      tag_ids: ["b", "c", "d"]
    ]
    Collection.test.set [
      _id: 10
      base_id: 100
      data: "Hello World! 1"
    ,
      _id: 10
      base_id: 100
      data: "Hello World! 2"
    ,
      _id: 20
      base_id: 100
      data: "Bye World!"
    ,
      _id: 30
      base_id: 101
      data: "invalid base id"
    ]

  it "belongs to base model", ->
    assert.deepEqual Query.tests.ids, [10, 20]
    assert.deepEqual Query.tests.pluck("base_id"),  [100, 100]
    assert.deepEqual Query.tests.pluck("base._id"), [100, 100]

  it "has test model by foreign key", ->
    assert.deepEqual Query.bases.list[0].tests.list.length, 2
    assert.deepEqual Query.bases.list[0].tests.ids, [10, 20]

  it "has base model by ids", ->
    assert.deepEqual Query.bases.list[0].base_ids,  [200, 300]
    assert.deepEqual Query.bases.list[0].bases.ids, [200, 300]
    assert.deepEqual Query.bases.list[0].tags.ids, ["a"]

  it "model graph", ->
    assert.deepEqual Query.bases.hash[500].path(0).ids,                     [500]
    assert.deepEqual Query.bases.hash[500].path(1).ids,           [300, 400, 500]
    assert.deepEqual Query.bases.hash[500].path(2).ids, [100,      300, 400, 500]
    assert.deepEqual Query.bases.hash[500].path(3).ids, [100, 200, 300, 400, 500]

  it "model graph cached", ->
    assert.deepEqual Query.bases["""path:[[500],3]"""].ids, [100, 200, 300, 400, 500]
    assert.deepEqual Query.bases["""path:[[500,400,300],2]"""].ids, [100, 200, 300, 400, 500]
    assert.deepEqual Query.bases["""path:[[500,400,300,100],1]"""].ids, [100, 200, 300, 400, 500]
    assert.deepEqual Query.bases["""path:[[500,400,300,100,200],0]"""].ids, [100, 200, 300, 400, 500]

  it "model tree", ->
    assert.deepEqual Query.bases.hash[500].nodes(0).ids,                     [500]
    assert.deepEqual Query.bases.hash[500].nodes(1).ids,                [400, 500]
    assert.deepEqual Query.bases.hash[500].nodes(2).ids, [100,           400, 500]
    assert.deepEqual Query.bases.hash[500].nodes(3).ids, [100, 200, 300, 400, 500]
