{ pack, unpack, Serial } = require("../memory-record.js")


describe "pack", ()->
  it "Keys", ->
    a = b = c = true
    assert pack.Keys({a,b,c}) == "a,b,c"

  it "Array", ->
    assert pack.Array([1,2,3]) == "1,2,3"
    assert pack.Array(1) == "1"
    assert pack.Array(null) == ""

  it "Date", ->
    now = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)")
    assert pack.Date(now) == "h6GJLTa"

  it "Bool", ->
    assert pack.Bool(true ) == "T"
    assert pack.Bool(false) == "F"
    assert pack.Bool(NaN)   == "F"

  it "Number", ->
    assert pack.Number(1) == "1"

  it "String", ->
    assert pack.String("[test]") == "[test]"
    assert pack.String(null) == ""

  it "Url", ->
    assert pack.Url("[test]") == "%5Btest%5D"
    assert pack.Url("a;b") == "a;b"
    assert pack.Url(null) == ""

  it "Cookie", ->
    assert pack.Cookie("[test]") == "%5Btest%5D"
    assert pack.Cookie("a;b") == "a%3Bb"
    assert pack.Cookie(null) == ""

  it "Text", ->
    assert pack.Text("[test]") == "%5Btest%5D"
    assert pack.Text("a;b") == "a%3Bb"
    assert pack.Text(null) == ""

  it "Thru", ->
    assert pack.Thru(undefined) == undefined


describe "unpack", ()->
  it "Keys", ->
    assert.deepEqual unpack.Keys("a,b,c"),
      a: true
      b: true
      c: true

  it "Array", ->
    assert.deepEqual unpack.Array("1,2,3"), ["1","2","3"]
    assert.deepEqual unpack.Array(-1), ["-1"]
    assert.deepEqual unpack.Array(null), []
    assert.deepEqual unpack.Array(undefined), []

  it "Date", ->
    now_int = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)") - 0
    assert unpack.Date("h6GJLTa") == now_int

  it "Bool", ->
    assert unpack.Bool("T")  == true
    assert unpack.Bool("F")  == false
    assert isNaN unpack.Bool(null)
    assert isNaN unpack.Bool("")

  it "Number", ->
    assert unpack.Number("1")   == 1
    assert unpack.Number("0xa") == 10
    assert isNaN unpack.Number("a")

  it "String", ->
    assert unpack.String(null) == ""
    assert unpack.String("") == ""
    assert unpack.String("%5btest%5d") == "%5btest%5d"

  it "Url", ->
    assert unpack.Url("%5Btest%5D") == "[test]"
    assert unpack.Url("%5btest%5d") == "[test]"
    assert unpack.Url(null) == ""
    assert unpack.Url("") == ""

  it "Cookie", ->
    assert unpack.Cookie("%5Btest%5D") == "[test]"
    assert unpack.Cookie("%5btest%5d") == "[test]"
    assert unpack.Cookie(null) == ""
    assert unpack.Cookie("") == ""

  it "Text", ->
    assert unpack.Text("%5Btest%5D") == "[test]"
    assert unpack.Text("%5btest%5d") == "[test]"
    assert unpack.Text(null) == ""
    assert unpack.Text("") == ""

  it "Thru", ->
    assert unpack.Thru(undefined) == undefined
