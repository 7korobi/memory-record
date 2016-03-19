{Collection, Query, Rule} = require("../memory-record.min.js")

describe "Collection", ()->
  it "set and query ids", ->
    new Rule("test").schema ->
    Collection.test.set [
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

describe "Query", ()->
  it "list", ->
    expect( Query.tests.list[0]._id ).to.eq 10
    expect( Query.tests.list[0].test_id ).to.eq 10
    expect( Query.tests.list[0].data.msg ).to.eq "Hello World!"

    expect( Query.tests.list[1]._id ).to.eq 20
    expect( Query.tests.list[1].test_id ).to.eq 20
    expect( Query.tests.list[1].data.msg ).to.eq "Bye World!"

    expect( Query.tests.list[2]._id ).to.eq "news"
    expect( Query.tests.list[2].test_id ).to.eq "news"
    expect( Query.tests.list[2].data.msg ).to.eq "Merge World!"


  it "hash", ->
    expect( Query.tests.hash[10]._id ).to.eq 10
    expect( Query.tests.hash[10].test_id ).to.eq 10
    expect( Query.tests.hash[10].data.msg ).to.eq "Hello World!"

    expect( Query.tests.hash[20]._id ).to.eq 20
    expect( Query.tests.hash[20].test_id ).to.eq 20
    expect( Query.tests.hash[20].data.msg ).to.eq "Bye World!"

    expect( Query.tests.hash.news._id ).to.eq "news"
    expect( Query.tests.hash.news.test_id ).to.eq "news"
    expect( Query.tests.hash.news.data.msg ).to.eq "Merge World!"
