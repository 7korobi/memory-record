Mem = require("../memory-record.min.js")

describe "Mem", ()->
  it "set", ->
    new Mem.Rule("test").schema ->
      @map_reduce ({type, _id}, emit)->
        emit "typed", type,
          count: 1
          all: _id
          min: _id
          max: _id

    Mem.rule.test.reset []
    for n in [1..100]
      Mem.rule.test.create
        _id: n
        type: "ABCDE"[n % 5]

    expect( Mem.tests.list.length ).to.eq 100

  it "reduced B", ->
    expect( Mem.tests.reduce.typed.B.count ).to.eq 20
    expect( Mem.tests.reduce.typed.B.all ).to.eq 970
    expect( Mem.tests.reduce.typed.B.avg ).to.eq 48.5
    expect( Mem.tests.reduce.typed.B.max_is ).to.eq Mem.tests.hash[96]
    expect( Mem.tests.reduce.typed.B.max ).to.eq 96
    expect( Mem.tests.reduce.typed.B.min_is ).to.eq Mem.tests.hash[1]
    expect( Mem.tests.reduce.typed.B.min ).to.eq 1

  it "reduced C", ->
    expect( Mem.tests.reduce.typed.C.count ).to.eq 20
    expect( Mem.tests.reduce.typed.C.all ).to.eq 990
    expect( Mem.tests.reduce.typed.C.avg ).to.eq 49.5
    expect( Mem.tests.reduce.typed.C.max_is ).to.eq Mem.tests.hash[97]
    expect( Mem.tests.reduce.typed.C.max ).to.eq 97
    expect( Mem.tests.reduce.typed.C.min_is ).to.eq Mem.tests.hash[2]
    expect( Mem.tests.reduce.typed.C.min ).to.eq 2

  it "reduced D", ->
    expect( Mem.tests.reduce.typed.D.count ).to.eq 20
    expect( Mem.tests.reduce.typed.D.all ).to.eq 1010
    expect( Mem.tests.reduce.typed.D.avg ).to.eq 50.5
    expect( Mem.tests.reduce.typed.D.max_is ).to.eq Mem.tests.hash[98]
    expect( Mem.tests.reduce.typed.D.max ).to.eq 98
    expect( Mem.tests.reduce.typed.D.min_is ).to.eq Mem.tests.hash[3]
    expect( Mem.tests.reduce.typed.D.min ).to.eq 3

  it "reduced E", ->
    expect( Mem.tests.reduce.typed.E.count ).to.eq 20
    expect( Mem.tests.reduce.typed.E.all ).to.eq 1030
    expect( Mem.tests.reduce.typed.E.avg ).to.eq 51.5
    expect( Mem.tests.reduce.typed.E.max_is ).to.eq Mem.tests.hash[99]
    expect( Mem.tests.reduce.typed.E.max ).to.eq 99
    expect( Mem.tests.reduce.typed.E.min_is ).to.eq Mem.tests.hash[4]
    expect( Mem.tests.reduce.typed.E.min ).to.eq 4

  it "reduced A", ->
    expect( Mem.tests.reduce.typed.A.count ).to.eq 20
    expect( Mem.tests.reduce.typed.A.all ).to.eq 1050
    expect( Mem.tests.reduce.typed.A.avg ).to.eq 52.5
    expect( Mem.tests.reduce.typed.A.max_is ).to.eq Mem.tests.hash[100]
    expect( Mem.tests.reduce.typed.A.max ).to.eq 100
    expect( Mem.tests.reduce.typed.A.min_is ).to.eq Mem.tests.hash[5]
    expect( Mem.tests.reduce.typed.A.min ).to.eq 5

  it "queried reduced", ->
    query = Mem.tests.where(({_id})-> _id % 2)
    expect( query.reduce.typed.A.count ).to.eq 10
    expect( query.reduce.typed.A.all ).to.eq 500
    expect( query.reduce.typed.A.avg ).to.eq 50
    expect( query.reduce.typed.A.max_is ).to.eq query.hash[95]
    expect( query.reduce.typed.A.max ).to.eq 95
    expect( query.reduce.typed.A.min_is ).to.eq query.hash[5]
    expect( query.reduce.typed.A.min ).to.eq 5

    expect( query.reduce.typed.B.count ).to.eq 10
    expect( query.reduce.typed.B.all ).to.eq 460
    expect( query.reduce.typed.B.avg ).to.eq 46
    expect( query.reduce.typed.B.max_is ).to.eq query.hash[91]
    expect( query.reduce.typed.B.max ).to.eq 91
    expect( query.reduce.typed.B.min_is ).to.eq query.hash[1]
    expect( query.reduce.typed.B.min ).to.eq 1
