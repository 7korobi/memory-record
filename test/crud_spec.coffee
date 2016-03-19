{Collection, Query, Rule} = require("../memory-record.min.js")

describe "Collection", ()->
  it "reset Array, add Object", ->
    new Rule("test").schema ->
    Collection.test.reset [
      _id: 10
      data:
        msg: "Hello World!"
    ,
      _id: 20
      data:
        msg: "Bye World!"
    ]
    Collection.test.add
      _id: "news"
      data:
        msg: "Merge World!"

    expect( Query.tests.ids ).to.have.members ["10", "20", "news"]

  it "reset Hash", ->
    new Rule("test").schema ->
    Collection.test.reset
      10:
        data:
          msg: "Hello World!"
      20:
        data:
          msg: "Bye World!"
      news:
        data:
          msg: "Merge World!"

    expect( Query.tests.ids ).to.have.members ["10", "20", "news"]


  it "remove", ->
    Collection.test.remove
      _id: 20
    expect( Query.tests.ids ).to.have.members ["10", "news"]
