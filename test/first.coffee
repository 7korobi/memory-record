chai = require 'chai'
sinon = require 'sinon'
expect = chai.expect

chai.use require 'sinon-chai'

Mem = require("../memory-record.js")

console.log Mem

describe "Mem", ()->
  it "set", ->
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

  it "query ids", ->
    expect( Mem.tests.ids ).to.have.members ["10", "20"]

  it "query list", ->
    expect( Mem.tests.list[0]._id ).to.eq 10
    expect( Mem.tests.list[0].test_id ).to.eq 10
    expect( Mem.tests.list[0].data.msg ).to.eq "Hello World!"

    expect( Mem.tests.list[1]._id ).to.eq 20
    expect( Mem.tests.list[1].test_id ).to.eq 20
    expect( Mem.tests.list[1].data.msg ).to.eq "Bye World!"

  it "query hash", ->
    expect( Mem.tests.hash[10]._id ).to.eq 10
    expect( Mem.tests.hash[10].test_id ).to.eq 10
    expect( Mem.tests.hash[10].data.msg ).to.eq "Hello World!"

    expect( Mem.tests.hash[20]._id ).to.eq 20
    expect( Mem.tests.hash[20].test_id ).to.eq 20
    expect( Mem.tests.hash[20].data.msg ).to.eq "Bye World!"
