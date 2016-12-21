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

  describe("Query", function() {
    var dml;
    new Rule("collection_spec").schema(function() {});
    dml = Collection.collection_spec;
    dml.set([
      {
        _id: 20
      }
    ]);
    dml.reset([
      {
        _id: 10
      }, {
        _id: 30
      }
    ]);
    dml.merge([
      {
        _id: 40
      }, {
        _id: 50
      }
    ]);
    dml.add({
      _id: 60
    });
    dml.append({
      _id: 70
    });
    dml.create({
      _id: 80
    });
    dml.add({
      _id: 100
    });
    dml.add({
      _id: 110
    });
    dml.add({
      _id: 120
    });
    dml.reject([
      {
        _id: 100
      }, {
        _id: 110
      }
    ]);
    dml.remove({
      _id: 120
    });
    dml.clear_cache();
    dml.refresh();
    dml.rehash();
    return it("ids", function() {
      return assert.deepEqual(Query.collection_specs.ids, ["10", "30", "40", "50", "60", "70", "80"]);
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Collection", function() {
    it("reset Array, add Object", function() {
      new Rule("test").schema(function() {});
      Collection.test.reset([
        {
          _id: 10,
          data: {
            msg: "Hello World!"
          }
        }, {
          _id: 20,
          data: {
            msg: "Bye World!"
          }
        }
      ]);
      Collection.test.add({
        _id: "news",
        data: {
          msg: "Merge World!"
        }
      });
      return assert.deepEqual(Query.tests.ids, ["10", "20", "news"]);
    });
    it("reset Hash", function() {
      new Rule("test").schema(function() {});
      Collection.test.reset({
        10: {
          data: {
            msg: "Hello World!"
          }
        },
        20: {
          data: {
            msg: "Bye World!"
          }
        },
        news: {
          data: {
            msg: "Merge World!"
          }
        }
      });
      return assert.deepEqual(Query.tests.ids, ["10", "20", "news"]);
    });
    return it("remove", function() {
      Collection.test.remove({
        _id: 20
      });
      return assert.deepEqual(Query.tests.ids, ["10", "news"]);
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Query", function() {
    new Rule("finder_spec").schema(function() {});
    Collection.finder_spec.set([
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
    Collection.finder_spec.add({
      _id: "news",
      data: {
        msg: "Merge World!"
      }
    });
    it("ids", function() {
      return assert.deepEqual(Query.finder_specs.ids, ["10", "30", "news"]);
    });
    it("list", function() {
      return assert.deepEqual(Query.finder_specs.list, [
        {
          _id: 10,
          finder_spec_id: 10,
          data: {
            msg: "Hello World!"
          }
        }, {
          _id: 30,
          finder_spec_id: 30,
          data: {
            msg: "Bye World!"
          }
        }, {
          _id: "news",
          finder_spec_id: "news",
          data: {
            msg: "Merge World!"
          }
        }
      ]);
    });
    return it("hash", function() {
      return assert.deepEqual(Query.finder_specs.hash, {
        10: {
          _id: 10,
          finder_spec_id: 10,
          data: {
            msg: "Hello World!"
          }
        },
        30: {
          _id: 30,
          finder_spec_id: 30,
          data: {
            msg: "Bye World!"
          }
        },
        news: {
          _id: "news",
          finder_spec_id: "news",
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

  new Rule("map_reduce_spec").schema(function() {
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

  Collection.map_reduce_spec.reset([]);

  for (n = i = 1; i <= 100; n = ++i) {
    Collection.map_reduce_spec.create({
      _id: n,
      type: "ABCDE"[n % 5]
    });
  }

  describe("Query", function() {
    it("set", function() {
      return assert(Query.map_reduce_specs.list.length === 100);
    });
    it("reduce", function() {
      var full, ref1, ref2, typed;
      ref1 = Query.map_reduce_specs.reduce, full = ref1.full, (ref2 = ref1["case"], typed = ref2.typed);
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
        max_is: Query.map_reduce_specs.hash[100],
        min_is: Query.map_reduce_specs.hash[5]
      });
      assert_only(typed.B, {
        count: 20,
        all: 970,
        avg: 48.5,
        max: 96,
        min: 1,
        max_is: Query.map_reduce_specs.hash[96],
        min_is: Query.map_reduce_specs.hash[1],
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
        max_is: Query.map_reduce_specs.hash[97],
        min_is: Query.map_reduce_specs.hash[2]
      });
      assert_only(typed.D, {
        count: 20,
        all: 1010,
        avg: 50.5,
        max: 98,
        min: 3,
        max_is: Query.map_reduce_specs.hash[98],
        min_is: Query.map_reduce_specs.hash[3]
      });
      return assert_only(typed.E, {
        count: 20,
        all: 1030,
        avg: 51.5,
        max: 99,
        min: 4,
        max_is: Query.map_reduce_specs.hash[99],
        min_is: Query.map_reduce_specs.hash[4]
      });
    });
    return it("queried reduce", function() {
      var full, ref1, ref2, typed;
      ref1 = Query.map_reduce_specs.where(function(arg) {
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
  var Collection, Query, Rule, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Collection", function() {
    return it("set", function() {
      new Rule("test").schema(function() {
        return this.order("data.order[2]");
      });
      Collection.test.set([
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
      Collection.test.create({
        _id: "news",
        key: "A",
        list: ["A"],
        data: {
          order: [-1, 0, 1],
          msg: "Merge World!",
          options: ["abcde", "cdefg", "defgh"]
        }
      });
      Collection.test.create({
        _id: "newnews",
        key: "C",
        list: ["C"],
        data: {
          order: [-2, -1, 0],
          msg: "Merge New World!",
          options: ["bcdef", "cdefg", "defgh"]
        }
      });
      return assert.deepEqual(Query.tests.pluck("_id"), ["newnews", "news", 20, 100]);
    });
  });

  describe("Query", function() {
    it("where selection for function", function() {
      return assert.deepEqual(Query.tests.where(function(o) {
        return o.key === "C";
      }).pluck("_id"), ["newnews"]);
    });
    it("where selection for String", function() {
      return assert.deepEqual(Query.tests.where({
        key: "A"
      }).pluck("_id"), [100, "news"]);
    });
    it("where selection for Array (same SQL IN)", function() {
      return assert.deepEqual(Query.tests.where({
        key: ["C", "A"]
      }).pluck("_id"), [100, "news", "newnews"]);
    });
    it("where selection for Regexp", function() {
      return assert.deepEqual(Query.tests.where({
        "data.msg": /Merge/
      }).pluck("_id"), ["news", "newnews"]);
    });
    it("where selection for Regexp", function() {
      return assert.deepEqual(Query.tests.where({
        "data.options.1": "cdefg"
      }).pluck("_id"), ["news", "newnews"]);
    });
    it("in selection for String", function() {
      return assert.deepEqual(Query.tests["in"]({
        key: "A"
      }).pluck("_id"), [20, 100, "news"]);
    });
    it("in selection for Array", function() {
      return assert.deepEqual(Query.tests["in"]({
        list: "A"
      }).pluck("_id"), [20, 100, "news"]);
    });
    it("in selection for Regexp", function() {
      return assert.deepEqual(Query.tests["in"]({
        "data.options": /abcde/
      }).pluck("_id"), [20, 100, "news"]);
    });
    it("sort defaults", function() {
      return assert.deepEqual(Query.tests.pluck("_id"), ["newnews", "news", 20, 100]);
    });
    it("sort (ascends)", function() {
      return assert.deepEqual(Query.tests.sort("_id").pluck("_id"), [20, 100, "newnews", "news"]);
    });
    it("sort ascends", function() {
      return assert.deepEqual(Query.tests.sort(["_id"], ["asc"]).pluck("_id"), [20, 100, "newnews", "news"]);
    });
    it("sort descends", function() {
      return assert.deepEqual(Query.tests.sort(["_id"], ["desc"]).pluck("_id"), [100, 20, "news", "newnews"]);
    });
    return it("shuffle", function() {
      return assert.deepEqual(Query.tests.shuffle().pluck("_id").sort(), [100, 20, "news", "newnews"].sort());
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Collection", function() {
    it("set", function() {
      new Rule("base").schema(function() {
        this.has_many("tests");
        return this.model = (function(superClass) {
          extend(model, superClass);

          function model() {
            return model.__super__.constructor.apply(this, arguments);
          }

          return model;

        })(this.model);
      });
      return new Rule("test").schema(function() {
        this.belongs_to("base", {
          dependent: true
        });
        return this.model = (function(superClass) {
          extend(model, superClass);

          function model() {
            return model.__super__.constructor.apply(this, arguments);
          }

          return model;

        })(this.model);
      });
    });
    return it("has base model", function() {
      Collection.base.set([
        {
          _id: 100
        }
      ]);
      Collection.test.set([
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
          data: "invalid data"
        }
      ]);
      assert.deepEqual(Query.tests.pluck("_id"), [10, 20]);
      return assert.deepEqual(Query.tests.pluck("base._id"), [100, 100]);
    });
  });

}).call(this);

(function() {
  var Collection, Query, Rule, ref;

  ref = require("../memory-record.js"), Collection = ref.Collection, Query = ref.Query, Rule = ref.Rule;

  describe("Collection", function() {
    return it("set", function() {
      new Rule("test").schema(function() {
        return this.scope(function(all) {
          return {
            topA: all.where({
              key: /^A/
            }),
            in_key: function(key) {
              return all["in"]({
                key: key
              });
            }
          };
        });
      });
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

  describe("Query", function() {
    it("scope call", function() {
      return assert.deepEqual(Query.tests.topA.ids, ["10", "news"]);
    });
    return it("scope with argument", function() {
      return assert.deepEqual(Query.tests.in_key("A").ids, ["10", "20", "news"]);
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

  describe("Collection", function() {
    return it("set", function() {
      new Rule("test").schema(function() {});
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
