{ Collection, Query, Rule } = require("../memory-record.js")


describe "sync", ()->
  it "set", ->
    new Rule "test",  ->

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
