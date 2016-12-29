{ Collection, Query, Rule, Model } = require("../memory-record.js")


new Rule "m_obj",  ->
  class @model extends @model

describe "Model", ()->
  it "rowid sequence", ->
    Model.m_obj.create = (item)->
      item.rowid = @rowid
    Collection.m_obj.merge
      3: {}
      2: {}
      1: {}
    assert.deepEqual Query.m_objs.list, [
      { _id: 1, rowid: 0, m_obj_id: 1 }
      { _id: 2, rowid: 1, m_obj_id: 2 }
      { _id: 3, rowid: 2, m_obj_id: 3 }
    ]
    assert Model.m_obj.rowid = 3

  it "catch create event", ->
    Model.m_obj.create = (item)->
      item.rowid = @rowid
      item.created = true

    Collection.m_obj.merge
      4: { a: 1 }
    assert.deepEqual Query.m_objs.hash[4], { a: 1, _id: 4, m_obj_id: 4, rowid: 3, created: true }

  it "catch update event", ->
    Model.m_obj.update = (item, {rowid})->
      item.rowid = rowid
      item.updated = true

    Collection.m_obj.merge
      4: { a: 2 }
    assert.deepEqual Query.m_objs.hash[4], { a: 2, _id: 4, m_obj_id: 4, rowid: 3, updated: true }

  it "catch delete event", ->
    Model.m_obj.delete = (old)->
      old.deleted = true

    target = Query.m_objs.hash[3]
    Collection.m_obj.del
      _id: 3
    assert.deepEqual target, { _id: 3, m_obj_id: 3, rowid: 2, deleted: true }
