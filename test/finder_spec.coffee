Mem = require("../memory-record.min.js")

describe "Mem", ()->
  it "set and query ids", ->
    new Mem.Rule("test").schema ->
    Mem.rule.test.set [
      _id: 10
      data:
        msg: "Hello World!"
    ,
      _id: 20
      data:
        msg: "Bye World!"
    ]
    Mem.rule.test.merge
      _id: "news"
      data:
        msg: "Merge World!"

    expect( Mem.tests.ids ).to.have.members ["10", "20", "news"]

  it "query list", ->
    expect( Mem.tests.list[0]._id ).to.eq 10
    expect( Mem.tests.list[0].test_id ).to.eq 10
    expect( Mem.tests.list[0].data.msg ).to.eq "Hello World!"

    expect( Mem.tests.list[1]._id ).to.eq 20
    expect( Mem.tests.list[1].test_id ).to.eq 20
    expect( Mem.tests.list[1].data.msg ).to.eq "Bye World!"

    expect( Mem.tests.list[2]._id ).to.eq "news"
    expect( Mem.tests.list[2].test_id ).to.eq "news"
    expect( Mem.tests.list[2].data.msg ).to.eq "Merge World!"


  it "query hash", ->
    expect( Mem.tests.hash[10]._id ).to.eq 10
    expect( Mem.tests.hash[10].test_id ).to.eq 10
    expect( Mem.tests.hash[10].data.msg ).to.eq "Hello World!"

    expect( Mem.tests.hash[20]._id ).to.eq 20
    expect( Mem.tests.hash[20].test_id ).to.eq 20
    expect( Mem.tests.hash[20].data.msg ).to.eq "Bye World!"

    expect( Mem.tests.hash.news._id ).to.eq "news"
    expect( Mem.tests.hash.news.test_id ).to.eq "news"
    expect( Mem.tests.hash.news.data.msg ).to.eq "Merge World!"
