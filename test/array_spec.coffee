require("../memory-record.min.js")

describe "Array", ()->
  it "<Number> sort", ->
    expect( [3,2,10].sort() ).to.have.members [2,3,10]
    expect( [3,2,10].sort "asc" ).to.have.members [2,3,10]
    expect( [3,2,10].sort "desc" ).to.have.members [10, 3, 2]
    expect( [3,2,10].sortBy (i)-> i ).to.have.members [2,3,10]
    expect( [3,2,10].sortBy "asc", (i)-> i ).to.have.members [2,3,10]
    expect( [3,2,10].sortBy "desc", (i)-> i ).to.have.members [10,3,2]

  it "<String> sort", ->
    expect( ["t", "a", "d"].sort() ).to.have.members ["a", "d", "t"]
    expect( ["t", "a", "d"].sort "asc" ).to.have.members ["a", "d", "t"]
    expect( ["t", "a", "d"].sort "desc" ).to.have.members ["t", "d", "a"]
    expect( ["t", "a", "d"].sortBy (s)-> s ).to.have.members ["a", "d", "t"]
    expect( ["t", "a", "d"].sortBy "asc", (s)-> ).to.have.members ["a", "d", "t"]
    expect( ["t", "a", "d"].sortBy "desc", (s)-> ).to.have.members ["t", "d", "a"]

  it "<Object> sort", ->
    list = [
      { a:3, b:2, c:1 }
      { a:2, b:4, c:3 }
      { a:1, b:6, c:1 }
    ]

    expect( list.sortBy("a")[0].a ).to.eq 1
    expect( list.sortBy("a")[0].b ).to.eq 6
    expect( list.sortBy("a")[0].c ).to.eq 1
    expect( list.sortBy("a")[1].a ).to.eq 2
    expect( list.sortBy("a")[1].b ).to.eq 4
    expect( list.sortBy("a")[1].c ).to.eq 3
    expect( list.sortBy("a")[2].a ).to.eq 3
    expect( list.sortBy("a")[2].b ).to.eq 2
    expect( list.sortBy("a")[2].c ).to.eq 1
