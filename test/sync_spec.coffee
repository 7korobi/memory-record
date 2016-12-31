{ Collection, Query, Rule } = require("../memory-record.js")


describe "sync", ()->
  it "set", ->
    new Rule "sync_obj",  ->

    Collection.sync_obj.set [
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
    Collection.sync_obj.create
      _id: "news"
      key: "A"
      list: ["A"]
      data:
        msg: "Merge World!"

    Collection.sync_obj.create
      _id: "newnews"
      key: "C"
      list: ["C"]
      data:
        msg: "Merge New World!"

    assert.deepEqual Query.sync_objs.ids, ["10", "20", "news", "newnews"]
