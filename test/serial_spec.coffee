{pack, unpack, Serial} = require("../memory-record.min.js")

describe "pack", ()->
  it "Keys", ->
    a = b = c = true
    expect( pack.Keys {a,b,c} ).to.eq "a,b,c"

  it "Array", ->
    expect( pack.Array [1,2,3] ).to.eq "1,2,3"

  it "Date", ->
    now = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)")
    expect( pack.Date now ).to.eq "h6GJLTa"

  it "Bool", ->
    expect( pack.Bool true ).to.eq "T"
    expect( pack.Bool false ).to.eq "F"

  it "Number", ->
    expect( pack.Number 1 ).to.eq "1"

  it "Text", ->
    expect( pack.Text "[test]" ).to.eq "%5btest%5d"

  it "String", ->
    expect( pack.String "[test]" ).to.eq "%5btest%5d"

  it "Thru", ->
    expect( pack.Thru "漢字" ).to.eq "漢字"


describe "unpack", ()->
  it "Keys", ->
    expect( unpack.Keys("a,b,c").a ).to.eq true
    expect( unpack.Keys("a,b,c").b ).to.eq true
    expect( unpack.Keys("a,b,c").c ).to.eq true

  it "Array", ->
    expect( unpack.Array("1,2,3")[0] ).to.eq "1"
    expect( unpack.Array("1,2,3")[1] ).to.eq "2"
    expect( unpack.Array("1,2,3")[2] ).to.eq "3"

  it "Date", ->
    now_int = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)") - 0
    expect( unpack.Date "h6GJLTa" ).to.eq now_int

  it "Bool", ->
    expect( unpack.Bool "T" ).to.eq true
    expect( unpack.Bool "F" ).to.eq false

  it "Number", ->
    expect( unpack.Number "1" ).to.eq 1

  it "Text", ->
    # expect( unpack.Text "%5btest%5d" ).to.eq "[test]"

  it "String", ->
    # expect( unpack.String "%5btest%5d" ).to.eq "[test]"

  it "Thru", ->
    expect( unpack.Thru "漢字" ).to.eq "漢字"
