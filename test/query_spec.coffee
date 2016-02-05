Mem = require("../memory-record.min.js")

describe "Mem", ()->
  it "set", ->
    new Mem.Rule("test").schema ->
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

  it "where selection", ->
    expect( Mem.tests.where(key: "A").ids ).to.have.members ["10", "news"]

  it "where allay selection", ->
    expect( Mem.tests.where(key: ["C","A"]).ids ).to.have.members ["10", "news", "newnews"]

  it "where regex selection", ->
    expect( Mem.tests.where(key: /^A/).ids ).to.have.members ["10", "news"]

  it "where in selection", ->
    expect( Mem.tests.in(key: "A").ids ).to.have.members ["10", "20", "news"]

  it "where in selection", ->
    expect( Mem.tests.in(list: "A").ids ).to.have.members ["10", "20", "news"]
