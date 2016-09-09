{Collection, Query, Rule} = require("../memory-record.min.js")

describe "Collection", ()->
  it "set", ->
    new Rule("test").schema ->
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

    expect( Query.tests.pluck("_id") ).to.have.members [10, 20, "news", "newnews"]

describe "Query", ()->
  it "where selection", ->
    expect( Query.tests.where(key: "A").pluck("_id") ).to.have.members [10, "news"]

  it "where allay selection", ->
    expect( Query.tests.where(key: ["C","A"]).pluck("_id") ).to.have.members [10, "news", "newnews"]

  it "where regex selection", ->
    expect( Query.tests.where(key: /^A/).pluck("_id") ).to.have.members [10, "news"]

  it "where in selection", ->
    expect( Query.tests.in(key: "A").pluck("_id") ).to.have.members [10, 20, "news"]

  it "where in selection", ->
    expect( Query.tests.in(list: "A").pluck("_id") ).to.have.members [10, 20, "news"]

  it "sort ascends", ->
    expect( Query.tests.sort("asc", "_id").pluck("_id").join("-") ).to.eq "10-20-newnews-news"

  it "sort descends", ->
    expect( Query.tests.sort("desc", "_id").pluck("_id").join("-") ).to.eq "20-10-news-newnews"

  it "shuffle", ->
    expect( Query.tests.shuffle().pluck("_id") ).to.have.members [10, 20, "news", "newnews"]
