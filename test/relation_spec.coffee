{Collection, Query, Rule} = require("../memory-record.min.js")

describe "Collection", ()->
  it "set", ->
    new Rule("base").schema ->
      @has_many "tests"
      class @model extends @model

    new Rule("test").schema ->
      @belongs_to "base", dependent: true
      class @model extends @model


  it "has base model", ->
    Collection.base.set [
      _id: 100
    ]
    Collection.test.set [
      _id: 10
      base_id: 100
      data: "Hello World!"
    ,
      _id: 20
      base_id: 100
      data: "Bye World!"
    ]

    expect( Query.tests.pluck("_id") ).to.have.members [10, 20]
    expect( Query.tests.pluck("base._id") ).to.have.members [100, 100]
