{ Collection, Query, Rule } = require("../memory-record.js")


new Rule("map_reduce_spec").schema ->
  class @model extends @model
    @map_reduce: ({type, _id}, emit)->
      emit "full"
        list: type
        set:  type
      emit "case", "typed", type,
        count: 1
        all: _id
        min: _id
        max: _id
        list: type
        set:  type


Collection.map_reduce_spec.reset []
for n in [1..100]
  Collection.map_reduce_spec.create
    _id: n
    type: "ABCDE"[n % 5]

chrs = (str)->
  list = for c in str
    c
  list.push undefined
  list

console.warn chrs "abc"

describe "Query", ()->
  it "set", ->
    expect( Query.map_reduce_specs.list.length ).to.eq 100

  its "reduce",
    Query.map_reduce_specs.reduce
    full:
      list: chrs "BCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEA"
      set:
        A: true
        B: true
        C: true
        D: true
        E: true
    case:
      typed:
        B:
          count: 20
          all:  970
          avg:   48.5
          max:   96
          min:    1
          max_is: Query.map_reduce_specs.hash[96]
          min_is: Query.map_reduce_specs.hash[ 1]
          set:
            B: true
          list: chrs "BBBBBBBBBBBBBBBBBBBB"
        C:
          count: 20
          all:  990
          avg:   49.5
          max:   97
          min:    2
          max_is: Query.map_reduce_specs.hash[97]
          min_is: Query.map_reduce_specs.hash[ 2]
        D:
          count: 20
          all: 1010
          avg:   50.5
          max:   98
          min:    3
          max_is: Query.map_reduce_specs.hash[98]
          min_is: Query.map_reduce_specs.hash[ 3]
        E:
          count: 20
          all: 1030
          avg:   51.5
          max:   99
          min:    4
          max_is: Query.map_reduce_specs.hash[99]
          min_is: Query.map_reduce_specs.hash[ 4]
        A:
          count: 20
          all: 1050
          avg:   52.5
          max:  100
          min:    5
          max_is: Query.map_reduce_specs.hash[100]
          min_is: Query.map_reduce_specs.hash[  5]

  its "queried reduce",
    Query.map_reduce_specs.where(({_id})-> _id % 2).reduce
    full:
      set:
        A: true
        B: true
        C: true
        D: true
        E: true
    case:
      typed:
        A:
          count: 10
          all:  500
          avg:   50
          max:   95
          min:    5
          set:
            A: true
          list: chrs "AAAAAAAAAA"
        B:
          count: 10
          all:  460
          avg:   46
          max:   91
          min:    1
          set:
            B: true
          list: chrs "BBBBBBBBBB"
