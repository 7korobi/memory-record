{ Collection, Query, Rule } = require("../memory-record.js")


describe "Collection", ()->
  it "set", ->
    new Rule("base").schema ->
      @order "_id"
      @has_many "tests"
      @has_many "bases", by: "ids"
      class @model extends @model

    new Rule("test").schema ->
      @belongs_to "base", dependent: true
      class @model extends @model

    Collection.base.set [
      _id: 100
      base_ids: [ 200, 300]
    ,
      _id: 200
    ,
      _id: 300
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
    assert.deepEqual Query.tests.pluck("_id"), [10, 20]
    assert.deepEqual Query.tests.pluck("base._id"), [100, 100]

  it "has test model by foreign key", ->
    assert.deepEqual Query.bases.list[0].tests.pluck("_id"), [10, 20]

  it "has base model by ids", ->
    assert.deepEqual Query.bases.list[0].base_ids,           [200, 300]
    assert.deepEqual Query.bases.list[0].bases.pluck("_id"), [200, 300]
