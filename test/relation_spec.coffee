{Collection, Query, Rule} = require("../memory-record.min.js")

describe "Collection", ()->
  return
  it "set", ->
    new Rule("base").schema ->
      @has_many "tests"
      @model class

    new Rule("test").schema ->
      @belongs_to "base", dependent: true
      @model class

    Collection.test.set [
      _id: 10
      base_id: 100
      data: "Hello World!"
    ,
      _id: 20
      base_id: 100
      data: "Bye World!"
    ]
    Collection.base.set [
      _id: 100
    ]

    expect( Query.tests.pluck("_id") ).to.have.members [10, 20]
