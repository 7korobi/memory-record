Mem = require("../memory-record.min.js")

describe "Mem", ()->
  it "set", ->
    new Mem.Rule("test").schema ->
      @scope (all)->
        topA: all.where(key: /^A/)
        in_key: (key)-> all.in {key}

    Mem.rule.test.set [
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
    Mem.rule.test.create
      _id: "news"
      key: "A"
      list: ["A"]
      data:
        msg: "Merge World!"

    Mem.rule.test.create
      _id: "newnews"
      key: "C"
      list: ["C"]
      data:
        msg: "Merge New World!"

    expect( Mem.tests.ids ).to.have.members ["10", "20", "news", "newnews"]

  it "scope call", ->
    expect( Mem.tests.topA.ids ).to.have.members ["10", "news"]

  it "scope with argument", ->
    expect( Mem.tests.in_key("A").ids ).to.have.members ["10", "20", "news"]
