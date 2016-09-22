{ pack, unpack, Serial } = require("../memory-record.js")


describe "pack", ()->
  it "Keys", ->
    a = b = c = true
    expect( pack.Keys {a,b,c} ).to.eq "a,b,c"

  it "Array", ->
    expect( pack.Array [1,2,3] ).to.eq "1,2,3"
    expect( pack.Array 1 ).to.eq "1"
    expect( pack.Array null ).to.eq ""

  it "Date", ->
    now = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)")
    expect( pack.Date now ).to.eq "h6GJLTa"

  it "Bool", ->
    expect( pack.Bool true  ).to.eq "T"
    expect( pack.Bool false ).to.eq "F"
    expect( pack.Bool NaN   ).to.eq "F"

  it "Number", ->
    expect( pack.Number 1 ).to.eq "1"

  it "String", ->
    expect( pack.String "[test]" ).to.eq "[test]"
    expect( pack.String null ).to.eq ""

  it "Url", ->
    expect( pack.Url "[test]" ).to.eq "%5Btest%5D"
    expect( pack.Url "a;b" ).to.eq "a;b"
    expect( pack.Url null ).to.eq ""

  it "Cookie", ->
    expect( pack.Cookie "[test]" ).to.eq "%5Btest%5D"
    expect( pack.Cookie "a;b" ).to.eq "a%3Bb"
    expect( pack.Cookie null ).to.eq ""

  it "Text", ->
    expect( pack.Text "[test]" ).to.eq "%5Btest%5D"
    expect( pack.Text "a;b" ).to.eq "a%3Bb"
    expect( pack.Text null ).to.eq ""

  it "Thru", ->
    expect( pack.Thru undefined ).to.eq undefined


describe "unpack", ()->
  it "Keys", ->
    expect( unpack.Keys("a,b,c").a ).to.eq true
    expect( unpack.Keys("a,b,c").b ).to.eq true
    expect( unpack.Keys("a,b,c").c ).to.eq true

  it "Array", ->
    expect( unpack.Array("1,2,3") ).to.have.members ["1","2","3"]
    expect( unpack.Array(-1) ).to.have.members ["-1"]
    expect( unpack.Array(null) ).to.have.members []
    expect( unpack.Array(undefined) ).to.have.members []

  it "Date", ->
    now_int = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)") - 0
    expect( unpack.Date "h6GJLTa" ).to.eq now_int

  it "Bool", ->
    expect( unpack.Bool "T" ).to.eq true
    expect( unpack.Bool "F" ).to.eq false
    expect( unpack.Bool null ).to.be.NaN
    expect( unpack.Bool "" ).to.be.NaN

  it "Number", ->
    expect( unpack.Number "1" ).to.eq 1
    expect( unpack.Number "0xa" ).to.eq 10
    expect( unpack.Number "a" ).to.be.NaN

  it "String", ->
    expect( unpack.String null ).to.eq ""
    expect( unpack.String "" ).to.eq ""
    expect( unpack.String "%5btest%5d" ).to.eq "%5btest%5d"

  it "Url", ->
    expect( unpack.Url "%5Btest%5D" ).to.eq "[test]"
    expect( unpack.Url "%5btest%5d" ).to.eq "[test]"
    expect( unpack.Url null ).to.eq ""
    expect( unpack.Url "" ).to.eq ""

  it "Cookie", ->
    expect( unpack.Cookie "%5Btest%5D" ).to.eq "[test]"
    expect( unpack.Cookie "%5btest%5d" ).to.eq "[test]"
    expect( unpack.Cookie null ).to.eq ""
    expect( unpack.Cookie "" ).to.eq ""

  it "Text", ->
    expect( unpack.Text "%5Btest%5D" ).to.eq "[test]"
    expect( unpack.Text "%5btest%5d" ).to.eq "[test]"
    expect( unpack.Text null ).to.eq ""
    expect( unpack.Text "" ).to.eq ""

  it "Thru", ->
    expect( unpack.Thru undefined ).to.eq undefined
