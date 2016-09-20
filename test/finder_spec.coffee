{Collection, Query, Rule} = require("../memory-record.min.js")

describe "Query", ()->
  new Rule("finder").schema ->
  Collection.finder.set [
    _id: 10
    data:
      msg: "Hello World!"
  ,
    _id: 30
    data:
      msg: "Bye World!"
  ]
  Collection.finder.add
    _id: "news"
    data:
      msg: "Merge World!"

  its "ids",
    Query.finders.ids
    ["10", "30", "news"]

  its "list",
    Query.finders.list
    [
      _id:     10
      finder_id: 10
      data:
        msg: "Hello World!"
    ,
      _id:     30
      finder_id: 30
      data:
        msg: "Bye World!"
    ,
      _id:     "news"
      finder_id: "news"
      data:
        msg: "Merge World!"
    ]

  its "hash",
    Query.finders.hash
    10:
      _id:     10
      finder_id: 10
      data:
        msg: "Hello World!"
    30:
      _id:     30
      finder_id: 30
      data:
        msg: "Bye World!"
    news:
      _id:     "news"
      finder_id: "news"
      data:
        msg: "Merge World!"
