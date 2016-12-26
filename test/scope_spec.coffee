{ Collection, Query, Rule } = require("../memory-record.js")


describe "scope deploy", ()->
  it "set", ->
    new Rule("test").schema ->
      @scope (all)->
        topA: all.where(key: /^A/)
        in_key: (key)-> all.in {key}

    Collection.test.set [
      _id: 10
      key: "A"
      list: ["A"]
      data:
        msg: "Hello World!"
    ,
      _id: 20
      key: "BA"
      list: ["A", "B"]
      data:
        msg: "Bye World!"
    ]
    Collection.test.create
      _id: "news"
      key: "A"
      list: ["A"]
      data:
        msg: "Merge World!"

    Collection.test.create
      _id: "newnews"
      key: "C"
      list: ["C"]
      data:
        msg: "Merge New World!"

    assert.deepEqual Query.tests.ids, ["10", "20", "news", "newnews"]

describe "scope", ()->
  it "call", ->
    assert.deepEqual Query.tests.topA.ids, ["10", "news"]
    assert.deepEqual Query.tests.in_key("A").ids, ["10", "20", "news"]

  it "call cached", ->
    assert.deepEqual Query.tests["""in_key:["A"]"""].ids, ["10", "20", "news"]

