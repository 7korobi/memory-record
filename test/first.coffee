Mem = require("../memory-record.js")
chai = require 'chai'
sinon = require 'sinon'
expect = chai.expect

chai.use require 'sinon-chai'

describe "test first", ()->
  it "spec spec", ->
    expect ->
      throw "Error"
    .to.throw("Error")

describe "Mem.faces", ()->
  it "test 1 + 1", ->
    expect( Mem.Rule ).to.eq 1
