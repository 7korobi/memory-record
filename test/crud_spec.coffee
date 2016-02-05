Mem = require("../memory-record.min.js")

describe "Mem", ()->
  it "set", ->
    new Mem.Rule("test").schema ->
    Mem.rule.test.reset [
      _id: 10
      data:
        msg: "Hello World!"
    ,
      _id: 20
      data:
        msg: "Bye World!"
    ]
    Mem.rule.test.add
      _id: "news"
      data:
        msg: "Merge World!"

    expect( Mem.tests.ids ).to.have.members ["10", "20", "news"]

  it "remove", ->
    Mem.rule.test.remove
      _id: 20
    expect( Mem.tests.ids ).to.have.members ["10", "news"]
