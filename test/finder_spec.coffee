{ Collection, Query, Rule } = require("../memory-record.js")

describe "Finder", ()->
  new Rule("finder_spec").schema ->
  Collection.finder_spec.set [
    _id: 10
    data:
      msg: "Hello World!"
  ,
    _id: 30
    data:
      msg: "Bye World!"
  ]
  Collection.finder_spec.add
    _id: "news"
    data:
      msg: "Merge World!"

  it "ids", ->
    assert.deepEqual Query.finder_specs.ids, ["10", "30", "news"]

  it "list", ->
    assert.deepEqual Query.finder_specs.list, [
      _id:     10
      finder_spec_id: 10
      data:
        msg: "Hello World!"
    ,
      _id:     30
      finder_spec_id: 30
      data:
        msg: "Bye World!"
    ,
      _id:     "news"
      finder_spec_id: "news"
      data:
        msg: "Merge World!"
    ]

  it "hash", ->
    assert.deepEqual Query.finder_specs.hash,
      10:
        _id:     10
        finder_spec_id: 10
        data:
          msg: "Hello World!"
      30:
        _id:     30
        finder_spec_id: 30
        data:
          msg: "Bye World!"
      news:
        _id:     "news"
        finder_spec_id: "news"
        data:
          msg: "Merge World!"
