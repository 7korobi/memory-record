{Collection, Query, Rule, Sync} = require("../memory-record.min.js")

describe "Collection", ()->
  it "set", ->
    new Rule("test").schema ->
      @sync Sync.test

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

    expect( Query.tests.ids ).to.have.members ["10", "20", "news", "newnews"]

describe "Query", ()->
  it "save A", ->
    Query.tests.in(list: "A").save()
    expect( Query.tests.finder.sync.load_index() ).to.have.members ["10", "20", "news"]

  it "save C", ->
    Query.tests.in(list: "C").save()
    expect( Query.tests.finder.sync.load_index() ).to.have.members ["newnews"]

describe "Collection", ()->
  it "fetch", ->
    expect( Collection.test.fetch() ).to.eq true
    expect( Query.tests.ids ).to.have.members ["newnews"]
