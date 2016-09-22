{ Collection, Query, Rule } = require("../memory-record.js")


describe "Query", ()->
  new Rule("collection_spec").schema ->
  dml = Collection.collection_spec
  dml.set [
    { _id: 20 }
  ]
  dml.reset [
    { _id: 10 }
    { _id: 30 }
  ]
  dml.merge [
    { _id: 40 }
    { _id: 50 }
  ]

  dml.add
    _id: 60
  dml.append
    _id: 70
  dml.create
    _id: 80


  dml.add
    _id: 100
  dml.add
    _id: 110
  dml.add
    _id: 120

  dml.reject [
    { _id: 100 }
    { _id: 110 }
  ]

  dml.remove
    _id: 120

  dml.clear_cache()
  dml.refresh()
  dml.rehash()

  it "ids", ->
    expect( Query.collection_specs.ids )
    .to.deep.eq ["10", "30", "40", "50", "60", "70", "80"]

