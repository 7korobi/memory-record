{ Collection, Query, Rule } = require("../memory-record.js")


new Rule "mr_obj",  ->
  class @model extends @model
    @map_reduce: ({type, _id}, emit)->
      emit "full",
        list: type
        set:  type
      emit "case", "typed", type,
        count: 1
        all: _id
        min: _id
        max: _id
        list: type
        set:  type


Collection.mr_obj.reset []
for n in [1..100]
  Collection.mr_obj.create
    _id: n
    type: "ABCDE"[n % 5]

describe "map_reduce", ()->
  it "distinct", ->
    assert.deepEqual Query.mr_objs.distinct("case.typed", "min_is").ids, [1..5]

  it "set", ->
    assert Query.mr_objs.list.length == 100

  it "reduce", ->
    { full, case:{ typed }} = Query.mr_objs.reduce
    assert full.list.join("") == "BCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEA"
    assert.deepEqual full.set,
      A: true
      B: true
      C: true
      D: true
      E: true

    assert_only typed.A,
      count: 20
      all: 1050
      avg:   52.5
      max:  100
      min:    5
      max_is: Query.mr_objs.hash[100]
      min_is: Query.mr_objs.hash[  5]
    assert_only typed.B,
      count: 20
      all:  970
      avg:   48.5
      max:   96
      min:    1
      max_is: Query.mr_objs.hash[96]
      min_is: Query.mr_objs.hash[ 1]
      set:
        B: true
    assert typed.B.list.join("") == "BBBBBBBBBBBBBBBBBBBB"
    assert_only typed.C,
      count: 20
      all:  990
      avg:   49.5
      max:   97
      min:    2
      max_is: Query.mr_objs.hash[97]
      min_is: Query.mr_objs.hash[ 2]
    assert_only typed.D,
      count: 20
      all: 1010
      avg:   50.5
      max:   98
      min:    3
      max_is: Query.mr_objs.hash[98]
      min_is: Query.mr_objs.hash[ 3]
    assert_only typed.E,
      count: 20
      all: 1030
      avg:   51.5
      max:   99
      min:    4
      max_is: Query.mr_objs.hash[99]
      min_is: Query.mr_objs.hash[ 4]

  it "queried reduce", ->
    { full, case:{ typed }} = Query.mr_objs.where(({_id})-> _id % 2).reduce
    assert.deepEqual full.set,
      A: true
      B: true
      C: true
      D: true
      E: true
    assert_only typed.A,
      count: 10
      all:  500
      avg:   50
      max:   95
      min:    5
      set:
        A: true
    assert typed.A.list.join("") == "AAAAAAAAAA"
    assert_only typed.B,
      count: 10
      all:  460
      avg:   46
      max:   91
      min:    1
      set:
        B: true
    assert typed.B.list.join("") == "BBBBBBBBBB"
