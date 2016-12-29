{ Collection, Query, Rule } = require("../memory-record.js")

describe "Finder", ()->
  new Rule "f_obj",  ->
  Collection.f_obj.set [
    _id: 10
    data:
      msg: "Hello World!"
  ,
    _id: 30
    data:
      msg: "Bye World!"
  ]
  Collection.f_obj.add
    _id: "news"
    data:
      msg: "Merge World!"

  it "ids", ->
    assert.deepEqual Query.f_objs.ids, ["10", "30", "news"]

  it "list", ->
    assert.deepEqual Query.f_objs.list, [
      _id:     10
      f_obj_id: 10
      data:
        msg: "Hello World!"
    ,
      _id:     30
      f_obj_id: 30
      data:
        msg: "Bye World!"
    ,
      _id:     "news"
      f_obj_id: "news"
      data:
        msg: "Merge World!"
    ]

  it "hash", ->
    assert.deepEqual Query.f_objs.hash,
      10:
        _id:     10
        f_obj_id: 10
        data:
          msg: "Hello World!"
      30:
        _id:     30
        f_obj_id: 30
        data:
          msg: "Bye World!"
      news:
        _id:     "news"
        f_obj_id: "news"
        data:
          msg: "Merge World!"
