{ Collection, Query, Rule } = require("../memory-record.js")


describe "Query deploy", ()->
  it "set", ->
    new Rule "q_obj",  ->
      @order "data.order[2]"
      @scope (all)->
        key:       (key)-> all.where((o)-> o.key == key)
        id_by_key: (key)-> all.key(key).pluck("_id")

    Collection.q_obj.set [
      _id: 100
      key: "A"
      list: ["A"]
      data:
        order: [1,2,3]
        msg: "Hello World!"
        options: [
          "abcde"
          "bcdef"
          "cdefg"
        ]
    ,
      _id: 20
      key: "BA"
      list: ["A", "B"]
      data:
        order: [0,1,2]
        msg: "Bye World!"
        options: [
          "abcde"
          "bcdef"
          "defgh"
        ]
    ]
    Collection.q_obj.create
      _id: "news"
      key: "A"
      list: ["A"]
      data:
        order: [-1,0,1]
        msg: "Merge World!"
        options: [
          "abcde"
          "cdefg"
          "defgh"
        ]

    Collection.q_obj.create
      _id: "newnews"
      key: "C"
      list: ["C"]
      data:
        order: [-2,-1,0]
        msg: "Merge New World!"
        options: [
          "bcdef"
          "cdefg"
          "defgh"
        ]

    assert.deepEqual Query.q_objs.pluck("_id"), ["newnews", "news", 20, 100]

describe "Query", ()->
  it "where selection", ->
    assert.deepEqual Query.q_objs.where((o)-> o.key == "C" ).pluck("_id"), ["newnews"]
    assert.deepEqual Query.q_objs.where(key: "A").pluck("_id"), ["news", 100]
    assert.deepEqual Query.q_objs.where("data.msg": /Merge/).pluck("_id"), ["newnews", "news"]
    assert.deepEqual Query.q_objs.where("data.options.1": "cdefg").pluck("_id"), ["newnews", "news"]

  it "where selection for Array (same SQL IN)", ->
    assert.deepEqual Query.q_objs.where(key: ["C","A"]).pluck("_id"), ["newnews", "news", 100]

  it "in selection", ->
    assert.deepEqual Query.q_objs.in(key: "A").pluck("_id"), ["news", 20, 100]
    assert.deepEqual Query.q_objs.in(list: "A").pluck("_id"), ["news", 20, 100]
    assert.deepEqual Query.q_objs.in("data.options": /abcde/).pluck("_id"), ["news", 20, 100]

  it "sort", ->
    assert.deepEqual Query.q_objs.pluck("_id"), ["newnews", "news", 20, 100]
    assert.deepEqual Query.q_objs.sort("_id").pluck("_id"), [20, 100, "newnews", "news"]
    assert.deepEqual Query.q_objs.sort(["_id"],["asc"]).pluck("_id"), [20, 100, "newnews", "news"]
    assert.deepEqual Query.q_objs.sort(["_id"],["desc"]).pluck("_id"), [100, 20, "news", "newnews"]

  it "shuffle", ->
    assert.deepEqual Query.q_objs.shuffle().pluck("_id").sort(), [100, 20, "newnews", "news"]
    assert.notDeepEqual Query.q_objs.shuffle().pluck("_id"),     [100, 20, "newnews", "news"]
    # fail per 4 * 3 * 2 * 1   if  shuffled order same as sorted.

  it "use scope", ->
    assert.deepEqual Query.q_objs.key("A").pluck("_id"), ["news", 100]
    assert.deepEqual Query.q_objs.key("C").pluck("_id"), ["newnews"]
    assert.deepEqual Query.q_objs.id_by_key("A"), ["news", 100]
    assert.deepEqual Query.q_objs.id_by_key("C"), ["newnews"]
    assert Query.q_objs.cache["""key:["A"]"""]
    assert Query.q_objs.cache["""key:["C"]"""]
    assert Query.q_objs.cache["""id_by_key:["A"]"""]
    assert Query.q_objs.cache["""id_by_key:["C"]"""]

    Collection.q_obj.clear_cache()
    assert Query.q_objs["key"]
    assert Query.q_objs["id_by_key"]
    assert ! Query.q_objs.cache["""key:["A"]"""]
    assert ! Query.q_objs.cache["""key:["C"]"""]
    assert ! Query.q_objs.cache["""id_by_key:["A"]"""]
    assert ! Query.q_objs.cache["""id_by_key:["C"]"""]

  it "reset for updated", ->
    assert.deepEqual Query.q_objs.key("A").pluck("_id"), ["news", 100]
    Collection.q_obj.add
      _id: "appendex"
      key: "A"
      data:
        order: [0,0,10]
    assert.deepEqual Query.q_objs.where(key: "A").pluck("_id"), ["news", 100, "appendex"]
    assert.deepEqual Query.q_objs.key("A").pluck("_id"), ["news", 100, "appendex"]

