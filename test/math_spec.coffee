require("../memory-record.min.js")

a = (str)->
  for c in str
    c

list = Math.permutation ->
  a: @zip [1..0b1000]...
  b: @shuffle a("あかさたな")...
  c: @product "icon", "btn"
  d:
    @product
      cog:   "COG"
    , home:  "HOME"


describe "Math.permutation", ()->
  it "size", ->
    expect( list.length ).to.eq 4

  it "zip", ->
    expect( list[0].a ).to.eq 1
    expect( list[1].a ).to.eq 2
    expect( list[2].a ).to.eq 3
    expect( list[3].a ).to.eq 4

  it "product", ->
    expect( list[0].c ).to.eq "icon"
    expect( list[1].c ).to.eq "icon"
    expect( list[2].c ).to.eq "btn"
    expect( list[3].c ).to.eq "btn"

  it "product", ->
    expect( list[0].d.cog  ).to.eq "COG"
    expect( list[1].d.home ).to.eq "HOME"
    expect( list[2].d.cog  ).to.eq "COG"
    expect( list[3].d.home ).to.eq "HOME"
