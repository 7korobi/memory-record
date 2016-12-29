(function() {
  var chomp_obj;

  global.assert = require("power-assert");

  chomp_obj = function(base, obj, a, b) {
    var bb, i, idx, key, len;
    if (!a) {
      return;
    }
    switch (b != null ? b.constructor : void 0) {
      case Object:
        obj[base] = {};
        for (key in b) {
          bb = b[key];
          if (a) {
            chomp_obj(key, obj[base], a[key], bb);
          }
        }
        break;
      case Array:
        obj[base] = [];
        for (idx = i = 0, len = b.length; i < len; idx = ++i) {
          bb = b[idx];
          if (a) {
            chomp_obj(idx, obj[base], a[idx], bb);
          }
        }
        break;
      default:
        obj[base] = a;
    }
    return obj;
  };

  global.assert_only = function(val, expect) {
    var value;
    value = chomp_obj("value", {}, val, expect).value;
    return assert.deepEqual(value, expect);
  };

}).call(this);

(function() {
  var Collection, Query, Rule, assert, ref;

  assert = require("power-assert");

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Collection", function() {
    var dml;
    new Rule("col_obj", function() {
      return this.order("_id");
    });
    dml = Collection.col_obj;
    it("data refresh", function() {
      dml.clear_cache();
      dml.refresh();
      return dml.rehash();
    });
    it("data set methods", function() {
      dml.reset([
        {
          _id: 10
        }, {
          _id: 30
        }
      ]);
      assert.deepEqual(Query.col_objs.ids, [10, 30]);
      dml.set([
        {
          _id: 20
        }
      ]);
      return assert.deepEqual(Query.col_objs.ids, [20]);
    });
    it("data append methods", function() {
      dml.set([
        {
          _id: 20
        }
      ]);
      dml.merge([
        {
          _id: 40
        }, {
          _id: 50
        }
      ]);
      assert.deepEqual(Query.col_objs.ids, [20, 40, 50]);
      dml.add({
        _id: 60
      });
      assert.deepEqual(Query.col_objs.ids, [20, 40, 50, 60]);
      dml.append({
        _id: 70
      });
      assert.deepEqual(Query.col_objs.ids, [20, 40, 50, 60, 70]);
      dml.create({
        _id: 80
      });
      return assert.deepEqual(Query.col_objs.ids, [20, 40, 50, 60, 70, 80]);
    });
    it("data set & append for hash data", function() {
      dml.set({
        10: {},
        20: {}
      });
      assert.deepEqual(Query.col_objs.ids, [10, 20]);
      dml.merge({
        100: {},
        110: {},
        120: {}
      });
      return assert.deepEqual(Query.col_objs.ids, [10, 20, 100, 110, 120]);
    });
    it("remove methods", function() {
      dml.set({
        10: {},
        20: {},
        100: {},
        110: {},
        120: {}
      });
      dml.reject([
        {
          _id: 100
        }, {
          _id: 110
        }
      ]);
      assert.deepEqual(Query.col_objs.ids, [10, 20, 120]);
      dml.remove({
        _id: 120
      });
      return assert.deepEqual(Query.col_objs.ids, [10, 20]);
    });
    it("remove without data", function() {
      dml.set({
        10: {},
        20: {}
      });
      dml.remove({
        _id: 999
      });
      return assert.deepEqual(Query.col_objs.ids, [10, 20]);
    });
    return it("add bad data", function() {
      assert.throws(function() {
        return dml.set("bad data");
      });
      return assert.throws(function() {
        return dml.set({
          10: "bad data 2",
          20: "bad data 3"
        });
      });
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Finder", function() {
    new Rule("f_obj", function() {});
    Collection.f_obj.set([
      {
        _id: 10,
        data: {
          msg: "Hello World!"
        }
      }, {
        _id: 30,
        data: {
          msg: "Bye World!"
        }
      }
    ]);
    Collection.f_obj.add({
      _id: "news",
      data: {
        msg: "Merge World!"
      }
    });
    it("ids", function() {
      return assert.deepEqual(Query.f_objs.ids, ["10", "30", "news"]);
    });
    it("list", function() {
      return assert.deepEqual(Query.f_objs.list, [
        {
          _id: 10,
          f_obj_id: 10,
          data: {
            msg: "Hello World!"
          }
        }, {
          _id: 30,
          f_obj_id: 30,
          data: {
            msg: "Bye World!"
          }
        }, {
          _id: "news",
          f_obj_id: "news",
          data: {
            msg: "Merge World!"
          }
        }
      ]);
    });
    return it("hash", function() {
      return assert.deepEqual(Query.f_objs.hash, {
        10: {
          _id: 10,
          f_obj_id: 10,
          data: {
            msg: "Hello World!"
          }
        },
        30: {
          _id: 30,
          f_obj_id: 30,
          data: {
            msg: "Bye World!"
          }
        },
        news: {
          _id: "news",
          f_obj_id: "news",
          data: {
            msg: "Merge World!"
          }
        }
      });
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, i, n, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  new Rule("mr_obj", function() {
    return this.model = (function(superClass) {
      extend(model, superClass);

      function model() {
        return model.__super__.constructor.apply(this, arguments);
      }

      model.map_reduce = function(arg, emit) {
        var _id, type;
        type = arg.type, _id = arg._id;
        emit("full", {
          list: type,
          set: type
        });
        return emit("case", "typed", type, {
          count: 1,
          all: _id,
          min: _id,
          max: _id,
          list: type,
          set: type
        });
      };

      return model;

    })(this.model);
  });

  Collection.mr_obj.reset([]);

  for (n = i = 1; i <= 100; n = ++i) {
    Collection.mr_obj.create({
      _id: n,
      type: "ABCDE"[n % 5]
    });
  }

  describe("map_reduce", function() {
    it("distinct", function() {
      return assert.deepEqual(Query.mr_objs.distinct("case.typed", "min_is").ids, [1, 2, 3, 4, 5]);
    });
    it("set", function() {
      return assert(Query.mr_objs.list.length === 100);
    });
    it("reduce", function() {
      var full, ref1, ref2, typed;
      ref1 = Query.mr_objs.reduce, full = ref1.full, (ref2 = ref1["case"], typed = ref2.typed);
      assert(full.list.join("") === "BCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEA");
      assert.deepEqual(full.set, {
        A: true,
        B: true,
        C: true,
        D: true,
        E: true
      });
      assert_only(typed.A, {
        count: 20,
        all: 1050,
        avg: 52.5,
        max: 100,
        min: 5,
        max_is: Query.mr_objs.hash[100],
        min_is: Query.mr_objs.hash[5]
      });
      assert_only(typed.B, {
        count: 20,
        all: 970,
        avg: 48.5,
        max: 96,
        min: 1,
        max_is: Query.mr_objs.hash[96],
        min_is: Query.mr_objs.hash[1],
        set: {
          B: true
        }
      });
      assert(typed.B.list.join("") === "BBBBBBBBBBBBBBBBBBBB");
      assert_only(typed.C, {
        count: 20,
        all: 990,
        avg: 49.5,
        max: 97,
        min: 2,
        max_is: Query.mr_objs.hash[97],
        min_is: Query.mr_objs.hash[2]
      });
      assert_only(typed.D, {
        count: 20,
        all: 1010,
        avg: 50.5,
        max: 98,
        min: 3,
        max_is: Query.mr_objs.hash[98],
        min_is: Query.mr_objs.hash[3]
      });
      return assert_only(typed.E, {
        count: 20,
        all: 1030,
        avg: 51.5,
        max: 99,
        min: 4,
        max_is: Query.mr_objs.hash[99],
        min_is: Query.mr_objs.hash[4]
      });
    });
    return it("queried reduce", function() {
      var full, ref1, ref2, typed;
      ref1 = Query.mr_objs.where(function(arg) {
        var _id;
        _id = arg._id;
        return _id % 2;
      }).reduce, full = ref1.full, (ref2 = ref1["case"], typed = ref2.typed);
      assert.deepEqual(full.set, {
        A: true,
        B: true,
        C: true,
        D: true,
        E: true
      });
      assert_only(typed.A, {
        count: 10,
        all: 500,
        avg: 50,
        max: 95,
        min: 5,
        set: {
          A: true
        }
      });
      assert(typed.A.list.join("") === "AAAAAAAAAA");
      assert_only(typed.B, {
        count: 10,
        all: 460,
        avg: 46,
        max: 91,
        min: 1,
        set: {
          B: true
        }
      });
      return assert(typed.B.list.join("") === "BBBBBBBBBB");
    });
  });

}).call(this);

(function() {
  var Collection, Model, Query, Rule, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule, Model = ref.Model;

  new Rule("m_obj", function() {
    return this.model = (function(superClass) {
      extend(model, superClass);

      function model() {
        return model.__super__.constructor.apply(this, arguments);
      }

      return model;

    })(this.model);
  });

  describe("Model", function() {
    it("rowid sequence", function() {
      Model.m_obj.create = function(item) {
        return item.rowid = this.rowid;
      };
      Collection.m_obj.merge({
        3: {},
        2: {},
        1: {}
      });
      assert.deepEqual(Query.m_objs.list, [
        {
          _id: 1,
          rowid: 0,
          m_obj_id: 1
        }, {
          _id: 2,
          rowid: 1,
          m_obj_id: 2
        }, {
          _id: 3,
          rowid: 2,
          m_obj_id: 3
        }
      ]);
      return assert(Model.m_obj.rowid = 3);
    });
    it("catch create event", function() {
      Model.m_obj.create = function(item) {
        item.rowid = this.rowid;
        return item.created = true;
      };
      Collection.m_obj.merge({
        4: {
          a: 1
        }
      });
      return assert.deepEqual(Query.m_objs.hash[4], {
        a: 1,
        _id: 4,
        m_obj_id: 4,
        rowid: 3,
        created: true
      });
    });
    it("catch update event", function() {
      Model.m_obj.update = function(item, arg) {
        var rowid;
        rowid = arg.rowid;
        item.rowid = rowid;
        return item.updated = true;
      };
      Collection.m_obj.merge({
        4: {
          a: 2
        }
      });
      return assert.deepEqual(Query.m_objs.hash[4], {
        a: 2,
        _id: 4,
        m_obj_id: 4,
        rowid: 3,
        updated: true
      });
    });
    return it("catch delete event", function() {
      var target;
      Model.m_obj["delete"] = function(old) {
        return old.deleted = true;
      };
      target = Query.m_objs.hash[3];
      Collection.m_obj.del({
        _id: 3
      });
      return assert.deepEqual(target, {
        _id: 3,
        m_obj_id: 3,
        rowid: 2,
        deleted: true
      });
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Query deploy", function() {
    return it("set", function() {
      new Rule("q_obj", function() {
        this.order("data.order[2]");
        return this.scope(function(all) {
          return {
            key: function(key) {
              return all.where(function(o) {
                return o.key === key;
              });
            },
            id_by_key: function(key) {
              return all.key(key).pluck("_id");
            }
          };
        });
      });
      Collection.q_obj.set([
        {
          _id: 100,
          key: "A",
          list: ["A"],
          data: {
            order: [1, 2, 3],
            msg: "Hello World!",
            options: ["abcde", "bcdef", "cdefg"]
          }
        }, {
          _id: 20,
          key: "BA",
          list: ["A", "B"],
          data: {
            order: [0, 1, 2],
            msg: "Bye World!",
            options: ["abcde", "bcdef", "defgh"]
          }
        }
      ]);
      Collection.q_obj.create({
        _id: "news",
        key: "A",
        list: ["A"],
        data: {
          order: [-1, 0, 1],
          msg: "Merge World!",
          options: ["abcde", "cdefg", "defgh"]
        }
      });
      Collection.q_obj.create({
        _id: "newnews",
        key: "C",
        list: ["C"],
        data: {
          order: [-2, -1, 0],
          msg: "Merge New World!",
          options: ["bcdef", "cdefg", "defgh"]
        }
      });
      return assert.deepEqual(Query.q_objs.pluck("_id"), ["newnews", "news", 20, 100]);
    });
  });

  describe("Query", function() {
    it("where selection", function() {
      assert.deepEqual(Query.q_objs.where(function(o) {
        return o.key === "C";
      }).pluck("_id"), ["newnews"]);
      assert.deepEqual(Query.q_objs.where({
        key: "A"
      }).pluck("_id"), ["news", 100]);
      assert.deepEqual(Query.q_objs.where({
        "data.msg": /Merge/
      }).pluck("_id"), ["newnews", "news"]);
      return assert.deepEqual(Query.q_objs.where({
        "data.options.1": "cdefg"
      }).pluck("_id"), ["newnews", "news"]);
    });
    it("where selection for Array (same SQL IN)", function() {
      return assert.deepEqual(Query.q_objs.where({
        key: ["C", "A"]
      }).pluck("_id"), ["newnews", "news", 100]);
    });
    it("in selection", function() {
      assert.deepEqual(Query.q_objs["in"]({
        key: "A"
      }).pluck("_id"), ["news", 20, 100]);
      assert.deepEqual(Query.q_objs["in"]({
        list: "A"
      }).pluck("_id"), ["news", 20, 100]);
      return assert.deepEqual(Query.q_objs["in"]({
        "data.options": /abcde/
      }).pluck("_id"), ["news", 20, 100]);
    });
    it("sort", function() {
      assert.deepEqual(Query.q_objs.pluck("_id"), ["newnews", "news", 20, 100]);
      assert.deepEqual(Query.q_objs.sort("_id").pluck("_id"), [20, 100, "newnews", "news"]);
      assert.deepEqual(Query.q_objs.sort(["_id"], ["asc"]).pluck("_id"), [20, 100, "newnews", "news"]);
      return assert.deepEqual(Query.q_objs.sort(["_id"], ["desc"]).pluck("_id"), [100, 20, "news", "newnews"]);
    });
    it("shuffle", function() {
      assert.deepEqual(Query.q_objs.shuffle().pluck("_id").sort(), [100, 20, "newnews", "news"]);
      return assert.notDeepEqual(Query.q_objs.shuffle().pluck("_id"), [100, 20, "newnews", "news"]);
    });
    return it("use scope", function() {
      assert.deepEqual(Query.q_objs.key("A").pluck("_id"), ["news", 100]);
      assert.deepEqual(Query.q_objs.key("C").pluck("_id"), ["newnews"]);
      assert.deepEqual(Query.q_objs.id_by_key("A"), ["news", 100]);
      assert.deepEqual(Query.q_objs.id_by_key("C"), ["newnews"]);
      Collection.q_obj.clear_cache();
      assert(Query.q_objs["key"]);
      assert(Query.q_objs["id_by_key"]);
      assert(Query.q_objs["key:[\"A\"]"]);
      assert(Query.q_objs["key:[\"C\"]"]);
      assert(Query.q_objs["id_by_key:[\"A\"]"]);
      return assert(Query.q_objs["id_by_key:[\"C\"]"]);
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, _, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  _ = require("lodash");

  describe("relation", function() {
    it("set", function() {
      new Rule("base", function() {
        this.order("_id");
        this.graph({
          directed: true
        });
        this.tree();
        this.has_many("tests");
        return this.has_many("tags", {
          by: "ids"
        });
      });
      new Rule("test", function() {
        return this.belongs_to("base", {
          dependent: true
        });
      });
      new Rule("tag", function() {});
      Collection.tag.set({
        a: {},
        b: {},
        c: {},
        d: {}
      });
      Collection.base.set([
        {
          _id: 100,
          base_id: 400,
          base_ids: [200, 300],
          tag_ids: ["a"]
        }, {
          _id: 200,
          base_id: 100,
          tag_ids: ["b"]
        }, {
          _id: 300,
          base_id: 100,
          tag_ids: ["c"]
        }, {
          _id: 400,
          base_id: 500,
          base_ids: [100, 300],
          tag_ids: ["a", "d"]
        }, {
          _id: 500,
          base_ids: [400, 300],
          tag_ids: ["b", "c", "d"]
        }
      ]);
      return Collection.test.set([
        {
          _id: 10,
          base_id: 100,
          data: "Hello World! 1"
        }, {
          _id: 10,
          base_id: 100,
          data: "Hello World! 2"
        }, {
          _id: 20,
          base_id: 100,
          data: "Bye World!"
        }, {
          _id: 30,
          base_id: 101,
          data: "invalid base id"
        }
      ]);
    });
    it("belongs to base model", function() {
      assert.deepEqual(Query.tests.ids, [10, 20]);
      assert.deepEqual(Query.tests.pluck("base_id"), [100, 100]);
      return assert.deepEqual(Query.tests.pluck("base._id"), [100, 100]);
    });
    it("has test model by foreign key", function() {
      assert.deepEqual(Query.bases.list[0].tests.list.length, 2);
      return assert.deepEqual(Query.bases.list[0].tests.ids, [10, 20]);
    });
    it("has base model by ids", function() {
      assert.deepEqual(Query.bases.list[0].base_ids, [200, 300]);
      assert.deepEqual(Query.bases.list[0].bases.ids, [200, 300]);
      return assert.deepEqual(Query.bases.list[0].tags.ids, ["a"]);
    });
    it("model graph", function() {
      assert.deepEqual(Query.bases.hash[500].path(0).ids, [500]);
      assert.deepEqual(Query.bases.hash[500].path(1).ids, [300, 400, 500]);
      assert.deepEqual(Query.bases.hash[500].path(2).ids, [100, 300, 400, 500]);
      return assert.deepEqual(Query.bases.hash[500].path(3).ids, [100, 200, 300, 400, 500]);
    });
    it("model graph cached", function() {
      assert.deepEqual(Query.bases["path:[[500],3]"].ids, [100, 200, 300, 400, 500]);
      assert.deepEqual(Query.bases["path:[[500,400,300],2]"].ids, [100, 200, 300, 400, 500]);
      assert.deepEqual(Query.bases["path:[[500,400,300,100],1]"].ids, [100, 200, 300, 400, 500]);
      return assert.deepEqual(Query.bases["path:[[500,400,300,100,200],0]"].ids, [100, 200, 300, 400, 500]);
    });
    it("model tree", function() {
      assert.deepEqual(Query.bases.hash[500].nodes(0).ids, [500]);
      assert.deepEqual(Query.bases.hash[500].nodes(1).ids, [400, 500]);
      assert.deepEqual(Query.bases.hash[500].nodes(2).ids, [100, 400, 500]);
      return assert.deepEqual(Query.bases.hash[500].nodes(3).ids, [100, 200, 300, 400, 500]);
    });
    return it("complex case", function() {
      return assert.deepEqual(Query.bases.hash[500].nodes(1)["in"]({
        tag_ids: "b"
      }).ids, [500]);
    });
  });

}).call(this);

(function() {
  var Serial, pack, ref, unpack;

  ref = require("../memory-record.js"), pack = ref.pack, unpack = ref.unpack, Serial = ref.Serial;

  describe("pack", function() {
    it("Keys", function() {
      var a, b, c;
      a = b = c = true;
      return assert(pack.Keys({
        a: a,
        b: b,
        c: c
      }) === "a,b,c");
    });
    it("Array", function() {
      assert(pack.Array([1, 2, 3]) === "1,2,3");
      assert(pack.Array(1) === "1");
      return assert(pack.Array(null) === "");
    });
    it("Date", function() {
      var now;
      now = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)");
      return assert(pack.Date(now) === "h6GJLTa");
    });
    it("Bool", function() {
      assert(pack.Bool(true) === "T");
      assert(pack.Bool(false) === "F");
      return assert(pack.Bool(NaN) === "F");
    });
    it("Number", function() {
      return assert(pack.Number(1) === "1");
    });
    it("String", function() {
      assert(pack.String("[test]") === "[test]");
      return assert(pack.String(null) === "");
    });
    it("Url", function() {
      assert(pack.Url("[test]") === "%5Btest%5D");
      assert(pack.Url("a;b") === "a;b");
      return assert(pack.Url(null) === "");
    });
    it("Cookie", function() {
      assert(pack.Cookie("[test]") === "%5Btest%5D");
      assert(pack.Cookie("a;b") === "a%3Bb");
      return assert(pack.Cookie(null) === "");
    });
    it("Text", function() {
      assert(pack.Text("[test]") === "%5Btest%5D");
      assert(pack.Text("a;b") === "a%3Bb");
      return assert(pack.Text(null) === "");
    });
    return it("Thru", function() {
      return assert(pack.Thru(void 0) === void 0);
    });
  });

  describe("unpack", function() {
    it("Keys", function() {
      return assert.deepEqual(unpack.Keys("a,b,c"), {
        a: true,
        b: true,
        c: true
      });
    });
    it("Array", function() {
      assert.deepEqual(unpack.Array("1,2,3"), ["1", "2", "3"]);
      assert.deepEqual(unpack.Array(-1), ["-1"]);
      assert.deepEqual(unpack.Array(null), []);
      return assert.deepEqual(unpack.Array(void 0), []);
    });
    it("Date", function() {
      var now_int;
      now_int = new Date("Mon Jan 25 2016 11:00:00 GMT+0900 (JST)") - 0;
      return assert(unpack.Date("h6GJLTa") === now_int);
    });
    it("Bool", function() {
      assert(unpack.Bool("T") === true);
      assert(unpack.Bool("F") === false);
      assert(isNaN(unpack.Bool(null)));
      return assert(isNaN(unpack.Bool("")));
    });
    it("Number", function() {
      assert(unpack.Number("1") === 1);
      assert(unpack.Number("0xa") === 10);
      return assert(isNaN(unpack.Number("a")));
    });
    it("String", function() {
      assert(unpack.String(null) === "");
      assert(unpack.String("") === "");
      return assert(unpack.String("%5btest%5d") === "%5btest%5d");
    });
    it("Url", function() {
      assert(unpack.Url("%5Btest%5D") === "[test]");
      assert(unpack.Url("%5btest%5d") === "[test]");
      assert(unpack.Url(null) === "");
      return assert(unpack.Url("") === "");
    });
    it("Cookie", function() {
      assert(unpack.Cookie("%5Btest%5D") === "[test]");
      assert(unpack.Cookie("%5btest%5d") === "[test]");
      assert(unpack.Cookie(null) === "");
      return assert(unpack.Cookie("") === "");
    });
    it("Text", function() {
      assert(unpack.Text("%5Btest%5D") === "[test]");
      assert(unpack.Text("%5btest%5d") === "[test]");
      assert(unpack.Text(null) === "");
      return assert(unpack.Text("") === "");
    });
    return it("Thru", function() {
      return assert(unpack.Thru(void 0) === void 0);
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("sync", function() {
    return it("set", function() {
      new Rule("test", function() {});
      Collection.test.set([
        {
          _id: 10,
          key: "A",
          list: ["A"],
          data: {
            msg: "Hello World!"
          }
        }, {
          _id: 20,
          key: "BA",
          list: ["A", "B"],
          data: {
            msg: "Bye World!"
          }
        }
      ]);
      Collection.test.create({
        _id: "news",
        key: "A",
        list: ["A"],
        data: {
          msg: "Merge World!"
        }
      });
      Collection.test.create({
        _id: "newnews",
        key: "C",
        list: ["C"],
        data: {
          msg: "Merge New World!"
        }
      });
      return assert.deepEqual(Query.tests.ids, ["10", "20", "news", "newnews"]);
    });
  });

}).call(this);
