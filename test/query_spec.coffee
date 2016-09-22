{ Collection, Query, Rule } = require("../memory-record.js")


describe "Collection", ()->
  it "set", ->
    new Rule("test").schema ->
      @order "data.order[2]"
    Collection.test.set [
      _id: 100
      key: "A"
      list: ["A"]
      data:
        order: [1,2,3]
        msg: "Hello World!"
        options: [
          "abcde"
          "bcdef"
          "cdefg"
        ]
    ,
      _id: 20
      key: "BA"
      list: ["A", "B"]
      data:
        order: [0,1,2]
        msg: "Bye World!"
        options: [
          "abcde"
          "bcdef"
          "defgh"
        ]
    ]
    Collection.test.create
      _id: "news"
      key: "A"
      list: ["A"]
      data:
        order: [-1,0,1]
        msg: "Merge World!"
        options: [
          "abcde"
          "cdefg"
          "defgh"
        ]

    Collection.test.create
      _id: "newnews"
      key: "C"
      list: ["C"]
      data:
        order: [-2,-1,0]
        msg: "Merge New World!"
        options: [
          "bcdef"
          "cdefg"
          "defgh"
        ]

    expect( Query.tests.pluck("_id") ).to.have.members [100, 20, "news", "newnews"]

describe "Query", ()->
  it "where selection for function", ->
    expect( Query.tests.where((o)-> o.key == "C" ).pluck("_id") ).to.have.members ["newnews"]

  it "where selection for String", ->
    expect( Query.tests.where(key: "A").pluck("_id") ).to.have.members [100, "news"]

  it "where selection for Array (same SQL IN)", ->
    expect( Query.tests.where(key: ["C","A"]).pluck("_id") ).to.have.members [100, "news", "newnews"]

  it "where selection for Regexp", ->
    expect( Query.tests.where("data.msg": /Merge/).pluck("_id") ).to.have.members ["news", "newnews"]

  it "where selection for Regexp", ->
    expect( Query.tests.where("data.options.1": "cdefg").pluck("_id") ).to.have.members ["news", "newnews"]

  it "in selection for String", ->
    expect( Query.tests.in(key: "A").pluck("_id") ).to.have.members [100, 20, "news"]

  it "in selection for Array", ->
    expect( Query.tests.in(list: "A").pluck("_id") ).to.have.members [100, 20, "news"]

  it "in selection for Regexp", ->
    expect( Query.tests.in("data.options": /abcde/).pluck("_id") ).to.have.members [100, 20, "news"]

  it "sort defaults", ->
    expect( Query.tests.pluck("_id") ).to.deep.eq ["newnews", "news", 20, 100]

  it "sort (ascends)", ->
    expect( Query.tests.sort("_id").pluck("_id") ).to.deep.eq [20, 100, "newnews", "news"]

  it "sort ascends", ->
    expect( Query.tests.sort(["_id"],["asc"]).pluck("_id") ).to.deep.eq [20, 100, "newnews", "news"]

  it "sort descends", ->
    expect( Query.tests.sort(["_id"],["desc"]).pluck("_id") ).to.deep.eq [100, 20, "news", "newnews"]

  it "shuffle", ->
    expect( Query.tests.shuffle().pluck("_id") ).to.have.members [100, 20, "news", "newnews"]
