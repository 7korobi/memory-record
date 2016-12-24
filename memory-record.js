/**
 memory-record - activerecord like in-memory data manager
 @version v0.2.9
 @link https://github.com/7korobi/memory-record
 @license 
**/


(function() {
  var Mem;

  module.exports = Mem = {
    Base: {},
    Query: {},
    Model: {},
    Collection: {},
    Composite: {}
  };

}).call(this);

(function() {
  var Mem, OBJ, f_composite, f_item, f_merge, f_remove, f_reset;

  OBJ = function() {
    return new Object(null);
  };

  f_reset = function(list, parent) {
    return this.rule.finder.reset(list, parent);
  };

  f_merge = function(list, parent) {
    return this.rule.finder.merge(list, parent);
  };

  f_remove = function(list) {
    return this.rule.finder.remove(list);
  };

  f_item = function(cb) {
    return function(item, parent) {
      return cb.call(this, [item], parent);
    };
  };

  f_composite = function() {
    return this.rule.finder.rehash();
  };

  Mem = module.exports;

  Mem.Base.Collection = (function() {
    Collection.prototype.set = f_reset;

    Collection.prototype.reset = f_reset;

    Collection.prototype.merge = f_merge;

    Collection.prototype.reject = f_remove;

    Collection.prototype.add = f_item(f_merge);

    Collection.prototype.append = f_item(f_merge);

    Collection.prototype.create = f_item(f_merge);

    Collection.prototype.remove = f_item(f_remove);

    Collection.prototype.clear_cache = f_composite;

    Collection.prototype.refresh = f_composite;

    Collection.prototype.rehash = f_composite;

    function Collection(rule) {
      this.rule = rule;
      this.validates = [];
    }

    return Collection;

  })();

}).call(this);

(function() {
  var Mem, OBJ, _, each,
    slice = [].slice;

  _ = require("lodash");

  OBJ = function() {
    return new Object(null);
  };

  each = function(from, process) {
    var i, id, item, len, ref, ref1;
    switch (from != null ? from.constructor : void 0) {
      case Array:
        ref = from || [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          if (!item) {
            continue;
          }
          process(item);
        }
        break;
      case Object:
        ref1 = from || {};
        for (id in ref1) {
          item = ref1[id];
          if (!item) {
            continue;
          }
          item._id = id;
          process(item);
        }
    }
  };

  Mem = module.exports;

  Mem.Base.Finder = (function() {
    function Finder(model, sortBy1, orderBy1) {
      var all;
      this.model = model;
      this.sortBy = sortBy1;
      this.orderBy = orderBy1;
      all = new Mem.Base.Query(this, [], this.sortBy, this.orderBy);
      all._memory = OBJ();
      this.scope = {
        all: all
      };
      this.query = {
        all: all
      };
      this.validates = [];
    }

    Finder.prototype.validate = function(cb) {
      return this.validates.push(cb);
    };

    Finder.prototype.use_cache = function(key, query_call) {
      switch (query_call != null ? query_call.constructor : void 0) {
        case Function:
          return this.query.all[key] = (function(_this) {
            return function() {
              var args, base1, name;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              return (base1 = _this.query.all)[name = key + ":" + (JSON.stringify(args))] != null ? base1[name] : base1[name] = query_call.apply(null, args);
            };
          })(this);
        default:
          return this.query.all[key] = query_call;
      }
    };

    Finder.prototype.rehash = function() {
      delete this.query.all._reduce;
      delete this.query.all._list;
      delete this.query.all._hash;
      this.query = {
        all: this.query.all
      };
    };

    Finder.prototype.calculate = function(query) {
      this.list(query, this.query.all._memory);
      if (query._list.length && (this.model.map_reduce != null)) {
        this.reduce(query);
        if (query._distinct != null) {
          this.group(query);
        }
      }
      this.sort(query);
    };

    Finder.prototype.reduce = function(query) {
      var base, calc, emits, i, id, init, item, len, map, o, path, paths, reduce, ref, ref1, ref2;
      init = function(map) {
        var o;
        o = OBJ();
        if (map.count) {
          o.count = 0;
        }
        if (map.all) {
          o.all = 0;
        }
        if (map.list) {
          o.list = [];
        }
        if (map.set) {
          o.set = OBJ();
        }
        return o;
      };
      reduce = function(item, o, map) {
        if (map.list) {
          o.list.push(map.list);
        }
        if (map.set) {
          o.set[map.set] = true;
        }
        if (!(map.max <= o.max)) {
          o.max_is = item;
          o.max = map.max;
        }
        if (!(o.min <= map.min)) {
          o.min_is = item;
          o.min = map.min;
        }
        if (map.count) {
          o.count += map.count;
        }
        if (map.all) {
          return o.all += map.all;
        }
      };
      calc = function(o) {
        if (o.all && o.count) {
          return o.avg = o.all / o.count;
        }
      };
      base = OBJ();
      paths = OBJ();
      ref = query._memory;
      for (id in ref) {
        ref1 = ref[id], item = ref1.item, emits = ref1.emits;
        for (i = 0, len = emits.length; i < len; i++) {
          ref2 = emits[i], path = ref2[0], map = ref2[1];
          o = _.get(base, path);
          if (!o) {
            o = paths[path.join(".")] = init(map);
            _.set(base, path, o);
            o;
          }
          reduce(item, o, map);
        }
      }
      for (path in paths) {
        o = paths[path];
        calc(o);
      }
      return query._reduce = base;
    };

    Finder.prototype.sort = function(query) {
      var orderBy, sortBy;
      sortBy = query.sortBy, orderBy = query.orderBy;
      if (sortBy != null) {
        return query._list = orderBy != null ? _.orderBy(query._list, sortBy, orderBy) : _.sortBy(query._list, sortBy);
      }
    };

    Finder.prototype.group = function(query) {
      var id, o, reduce, ref, target;
      ref = query._distinct, reduce = ref.reduce, target = ref.target;
      return query._list = (function() {
        var ref1, results;
        ref1 = query._reduce[reduce];
        results = [];
        for (id in ref1) {
          o = ref1[id];
          results.push(o[target]);
        }
        return results;
      })();
    };

    Finder.prototype.list = function(query, all) {
      var chk, deploy, every, id, ids, o, ref;
      if (query._memory === all) {
        deploy = function(id, o) {
          return query._hash[id] = o.item;
        };
      } else {
        query._memory = OBJ();
        deploy = function(id, o) {
          query._memory[id] = o;
          return query._hash[id] = o.item;
        };
      }
      ids = (ref = query._ids) != null ? ref : Object.keys(all);
      query._hash = OBJ();
      return query._list = (function() {
        var i, j, len, len1, ref1, results;
        results = [];
        for (i = 0, len = ids.length; i < len; i++) {
          id = ids[i];
          o = all[id];
          every = true;
          ref1 = query.filters;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            chk = ref1[j];
            if (!(!chk(o.item))) {
              continue;
            }
            every = false;
            break;
          }
          if (!every) {
            continue;
          }
          results.push(deploy(id, o));
        }
        return results;
      })();
    };

    Finder.prototype.remove = function(from) {
      var _memory;
      _memory = this.query.all._memory;
      each(from, (function(_this) {
        return function(item) {
          var old;
          old = _memory[item._id];
          if (old != null) {
            _this.model["delete"](old);
            delete _memory[item._id];
          }
        };
      })(this));
      return this.rehash();
    };

    Finder.prototype.reset = function(from, parent) {
      var _memory, item, key, news, old;
      _memory = this.query.all._memory;
      this.query.all._memory = news = OBJ();
      this.merge(from, parent);
      for (key in _memory) {
        old = _memory[key];
        item = news[key];
        if (item != null) {
          this.model.update(item, old);
        } else {
          this.model["delete"](old);
        }
      }
      return this.rehash();
    };

    Finder.prototype.merge = function(from, parent) {
      var _memory;
      _memory = this.query.all._memory;
      each(from, (function(_this) {
        return function(item) {
          var chk, emit, every, i, key, len, o, old, ref, val;
          for (key in parent) {
            val = parent[key];
            item[key] = val;
          }
          item.__proto__ = _this.model.prototype;
          _this.model.call(item, item, _this.model);
          _this.model.rowid++;
          every = true;
          ref = _this.validates;
          for (i = 0, len = ref.length; i < len; i++) {
            chk = ref[i];
            if (!(!chk(item))) {
              continue;
            }
            every = false;
            break;
          }
          if (every) {
            o = {
              item: item,
              emits: []
            };
            old = _memory[item._id];
            if (old != null) {
              _this.model.update(item, old);
            } else {
              _this.model.create(item);
            }
            _memory[item._id] = o;
            if (_this.model.map_reduce != null) {
              emit = function() {
                var cmd, j, keys;
                keys = 2 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 1) : (j = 0, []), cmd = arguments[j++];
                return o.emits.push([keys, cmd]);
              };
              _this.model.map_reduce(item, emit);
            }
          }
        };
      })(this));
      return this.rehash();
    };

    return Finder;

  })();

}).call(this);

(function() {
  var Mem;

  Mem = module.exports;

  Mem.Base.Model = (function() {
    Model.rowid = 0;

    Model.update = function(item, old) {};

    Model.create = function(item) {};

    Model["delete"] = function(old) {};

    function Model(o, m) {
      if (!o._id) {
        o._id = o[m.id];
      }
      if (!o[m.id]) {
        o[m.id] = o._id;
      }
    }

    return Model;

  })();

}).call(this);

(function() {
  var Mem, OBJ, _, set_for,
    slice = [].slice;

  _ = require("lodash");

  OBJ = function() {
    return new Object(null);
  };

  set_for = function(list) {
    var i, key, len, set;
    set = OBJ();
    for (i = 0, len = list.length; i < len; i++) {
      key = list[i];
      set[key] = true;
    }
    return set;
  };

  Mem = module.exports;

  Mem.Base.Query = (function() {
    function Query(finder, filters1, sortBy1, orderBy1) {
      this.finder = finder;
      this.filters = filters1;
      this.sortBy = sortBy1;
      this.orderBy = orderBy1;
    }

    Query.prototype._query_parser = function(req, cb) {
      var doit, filters, target;
      if (!req) {
        return this;
      }
      filters = this.filters.concat();
      doit = function(target, req, path) {
        var f;
        f = cb(target, req, path);
        if (f) {
          return filters.push(f);
        }
      };
      switch (req != null ? req.constructor : void 0) {
        case Object:
          for (target in req) {
            req = req[target];
            doit(target, req, _.property(target));
          }
          break;
        case Function:
        case Array:
        case String:
          doit(target, req, function(o) {
            return o;
          });
          break;
        default:
          console.log({
            req: req
          });
          throw Error('unimplemented');
      }
      return new Query(this.finder, filters, this.orderBy);
    };

    Query.prototype["in"] = function(req) {
      var q;
      q = this._query_parser(req, function(target, req, path) {
        var set;
        switch (req != null ? req.constructor : void 0) {
          case Array:
            set = set_for(req);
            return function(o) {
              var i, key, len, ref;
              ref = path(o);
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                if (set[key]) {
                  return true;
                }
              }
              return false;
            };
          case RegExp:
            return function(o) {
              var i, len, ref, val;
              ref = path(o);
              for (i = 0, len = ref.length; i < len; i++) {
                val = ref[i];
                if (req.test(val)) {
                  return true;
                }
              }
              return false;
            };
          case null:
          case Boolean:
          case String:
          case Number:
            return function(o) {
              set = set_for(path(o));
              return set[req];
            };
          default:
            console.log({
              req: req
            });
            throw Error('unimplemented');
        }
      });
      return q;
    };

    Query.prototype.where = function(req) {
      var ids, q;
      ids = null;
      q = this._query_parser(req, function(target, req, path) {
        var set;
        switch (req != null ? req.constructor : void 0) {
          case Function:
            return req;
          case Array:
            if ("id" === target) {
              ids = req;
              return null;
            } else {
              set = set_for(req);
              return function(o) {
                return set[path(o)];
              };
            }
            break;
          case RegExp:
            return function(o) {
              return req.test(path(o));
            };
          case null:
          case Boolean:
          case String:
          case Number:
            return function(o) {
              return req === path(o);
            };
          default:
            console.log({
              req: req
            });
            throw Error('unimplemented');
        }
      });
      if (ids != null) {
        q._ids = ids;
      }
      return q;
    };

    Query.prototype.search = function(text) {
      var item, list, regexp;
      if (!text) {
        return this;
      }
      list = (function() {
        var i, len, ref, results;
        ref = text.split(/\s+/);
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          item = item.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          if (!item.length) {
            continue;
          }
          results.push("(" + item + ")");
        }
        return results;
      })();
      if (!list.length) {
        return this;
      }
      regexp = new RegExp(list.join("|"), "ig");
      return this.where(function(o) {
        return (!o.search_words) || regexp.test(o.search_words);
      });
    };

    Query.prototype.distinct = function(reduce, target) {
      var query;
      query = new Query(this.finder, this.filters, this.orderBy);
      query._distinct = {
        reduce: reduce,
        target: target
      };
      return query;
    };

    Query.prototype.sort = function(sortBy, orderBy) {
      if (_.isEqual([sortBy, orderBy], [this.sortBy, this.orderBy])) {
        return this;
      }
      return new Query(this.finder, this.filters, sortBy, orderBy);
    };

    Query.prototype.shuffle = function() {
      return new Query(this.finder, this.filters, Math.random);
    };

    Query.prototype.clear = function() {
      delete this._reduce;
      delete this._list;
      delete this._hash;
      return delete this._memory;
    };

    Query.prototype.save = function() {
      return this.finder.save(this);
    };

    Query.prototype.find = function(id) {
      return this.hash[id];
    };

    Query.prototype.finds = function(ids) {
      var i, id, len, o, results;
      results = [];
      for (i = 0, len = ids.length; i < len; i++) {
        id = ids[i];
        if (o = this.hash[id]) {
          results.push(o);
        }
      }
      return results;
    };

    Query.prototype.pluck = function() {
      var keys;
      keys = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      switch (keys.length) {
        case 0:
          return this.list.map(function() {
            return null;
          });
        case 1:
          return this.list.map(function(o) {
            var a;
            a = _.at(o, keys)[0];
            return a;
          });
        default:
          return this.list.map(function(o) {
            return _.at(o, keys);
          });
      }
    };

    Object.defineProperties(Query.prototype, {
      reduce: {
        get: function() {
          if (this._reduce == null) {
            this.finder.calculate(this);
          }
          return this._reduce;
        }
      },
      list: {
        get: function() {
          if (this._list == null) {
            this.finder.calculate(this);
          }
          return this._list;
        }
      },
      hash: {
        get: function() {
          if (this._hash == null) {
            this.finder.calculate(this);
          }
          return this._hash;
        }
      },
      memory: {
        get: function() {
          if (this._memory == null) {
            this.finder.calculate(this);
          }
          return this._memory;
        }
      },
      ids: {
        get: function() {
          return Object.keys(this.memory);
        }
      }
    });

    return Query;

  })();

}).call(this);

(function() {
  Object.defineProperties(Array.prototype, {
    first: {
      get: function() {
        return this[0];
      }
    },
    last: {
      get: function() {
        return this[this.length - 1];
      }
    },
    cycle: {
      value: function(n) {
        var i, idx, ref, results;
        results = [];
        for (idx = i = 0, ref = n; 0 <= ref ? i <= ref : i >= ref; idx = 0 <= ref ? ++i : --i) {
          results.push(this[idx % this.length]);
        }
        return results;
      }
    }
  });

}).call(this);

(function() {
  var Mem, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  _ = require("lodash");

  Mem = module.exports;

  Mem.Rule = (function() {
    function Rule(field) {
      this.field = field;
      this.model_id = this.field + "_id";
      this.model_list = this.field + "s";
      this.depend_on(this.field);
      this.finder = new Mem.Base.Finder("_id");
      this.model = Mem.Base.Model;
      this.dml = new Mem.Base.Collection(this);
      this.inits = [];
    }

    Rule.prototype.schema = function(cb) {
      var i, init, len, ref;
      cb.call(this, this.dml);
      this.model.id = this.model_id;
      this.model.list = this.model_list;
      if (this.model === Mem.Base.Model) {
        this.model = (function(superClass) {
          extend(model, superClass);

          function model() {
            return model.__super__.constructor.apply(this, arguments);
          }

          return model;

        })(this.model);
      }
      ref = this.inits;
      for (i = 0, len = ref.length; i < len; i++) {
        init = ref[i];
        init();
      }
      Mem.Model[this.field] = this.finder.model = this.model;
      Mem.Collection[this.field] = this.dml;
      Mem.Query[this.model_list] = this.finder.query.all;
      return this;
    };

    Rule.prototype.composite = function() {
      var f, i, len, ref;
      ref = Mem.Composite[this.field];
      for (i = 0, len = ref.length; i < len; i++) {
        f = ref[i];
        f();
      }
    };

    Rule.prototype.depend_on = function(parent) {
      var base;
      if ((base = Mem.Composite)[parent] == null) {
        base[parent] = [];
      }
      return Mem.Composite[parent].push(function() {
        return Mem.Collection[parent].rule.finder.rehash();
      });
    };

    Rule.prototype.scope = function(cb) {
      var key, query_call, ref, results;
      this.finder.scope = cb(this.finder.query.all);
      ref = this.finder.scope;
      results = [];
      for (key in ref) {
        query_call = ref[key];
        results.push(this.finder.use_cache(key, query_call));
      }
      return results;
    };

    Rule.prototype.relation_to_one = function(key, target, ik) {
      return this.inits.push((function(_this) {
        return function() {
          return Object.defineProperty(_this.model.prototype, key, {
            get: function() {
              return Mem.Query[target].find(this[ik]);
            }
          });
        };
      })(this));
    };

    Rule.prototype.relation_to_many = function(key, target, ik, qk) {
      var all;
      all = this.finder.query.all;
      this.finder.use_cache(key, function(id) {
        var obj;
        return Mem.Query[target].where((
          obj = {},
          obj["" + qk] = id,
          obj
        ));
      });
      return this.inits.push((function(_this) {
        return function() {
          return Object.defineProperty(_this.model.prototype, key, {
            get: function() {
              return all[key](this[ik]);
            }
          });
        };
      })(this));
    };

    Rule.prototype.tree_base = function(key, ik) {};

    Rule.prototype.graph_base = function(key, ik, qk) {
      var all;
      all = this.finder.query.all;
      this.finder.use_cache(key, function(id, n) {
        var a, i, j, k, len, len1, obj, q, ref;
        q = all.where((
          obj = {},
          obj["" + qk] = id,
          obj
        ));
        if (n) {
          ref = q.pluck(ik);
          for (i = 0, len = ref.length; i < len; i++) {
            a = ref[i];
            if (a != null) {
              for (j = 0, len1 = a.length; j < len1; j++) {
                k = a[j];
                if (key != null) {
                  id.push(k);
                }
              }
            }
          }
          return all[key](_.uniq(id), n - 1);
        } else {
          return q;
        }
      });
      return this.model.prototype[key] = function(n) {
        return all[key]([this[qk]], n);
      };
    };

    Rule.prototype.belongs_to = function(to, option) {
      var dependent, key, ref, ref1, target;
      if (option == null) {
        option = {};
      }
      key = (ref = option.key) != null ? ref : to + "_id", target = (ref1 = option.target) != null ? ref1 : to + "s", dependent = option.dependent;
      this.relation_to_one(to, target, key);
      if (dependent) {
        this.depend_on(to);
        return this.finder.validate(function(o) {
          return o[to] != null;
        });
      }
    };

    Rule.prototype.has_many = function(to, option) {
      var ik, key, qk, ref, target;
      if (option == null) {
        option = {};
      }
      key = option.key, target = (ref = option.target) != null ? ref : to;
      switch (option.by) {
        case "ids":
          ik = key != null ? key : to.replace(/s$/, "_ids");
          qk = "_id";
          break;
        default:
          ik = "_id";
          qk = key != null ? key : this.model_id;
      }
      return this.relation_to_many(to, target, ik, qk);
    };

    Rule.prototype.tree = function(option) {
      var ik, key;
      if (option == null) {
        option = {};
      }
      key = option.key;
      ik = key != null ? key : this.model_list + "_id";
      return this.relation_to_one("up", ik);
    };

    Rule.prototype.graph = function(option) {
      var ik, key;
      if (option == null) {
        option = {};
      }
      key = option.key;
      ik = key != null ? key : this.model_list.replace(/s$/, "_ids");
      return this.graph_base("nodes", ik, "_id");
    };

    Rule.prototype.shuffle = function() {
      var query;
      query = this.finder.query.all.shuffle();
      query._memory = this.finder.query.all._memory;
      return Mem.Query[this.model_list] = this.finder.query.all = query;
    };

    Rule.prototype.order = function(sortBy, orderBy) {
      var query;
      query = this.finder.query.all.sort(sortBy, orderBy);
      query._memory = this.finder.query.all._memory;
      return Mem.Query[this.model_list] = this.finder.query.all = query;
    };

    Rule.prototype.protect = function() {
      var keys;
      keys = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.protect = function(o, old) {
        var i, key, len, results;
        results = [];
        for (i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          results.push(o[key] = old[key]);
        }
        return results;
      };
    };

    return Rule;

  })();

}).call(this);

(function() {
  var Mem, OBJ, Serial, array_base_parser, base, escaped, func, key, pack, patch_size, serial, string_parser, string_serializer, symbol_parser, symbol_serializer, textfy, unpack, url_serializer;

  OBJ = function() {
    return new Object(null);
  };

  serial = null;

  base = function(code) {
    var c, i, len, n, ref;
    serial = {
      to_s: code,
      to_i: {}
    };
    ref = serial.to_s;
    for (n = i = 0, len = ref.length; i < len; n = ++i) {
      c = ref[n];
      serial.to_i[c] = n;
    }
    return serial.size = serial.to_s.length;
  };

  base("0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

  patch_size = serial.size * serial.size * serial.size;

  textfy = function(cb) {
    return function(val) {
      switch (val) {
        case "":
        case null:
        case void 0:
          return "";
        default:
          return cb(val);
      }
    };
  };

  string_parser = string_serializer = textfy(String);

  symbol_parser = textfy(decodeURI);

  url_serializer = textfy(encodeURI);

  symbol_serializer = textfy(function(val) {
    return String(val).replace(/[~\/=.&\?\#\[\]()\"'`;]/g, function(s) {
      return "%" + s.charCodeAt(0).toString(16).toUpperCase();
    });
  });

  array_base_parser = function(val) {
    if (Array.isArray(val)) {
      return val;
    }
    switch (val) {
      case "":
      case null:
      case void 0:
        return [];
      default:
        return string_parser(val).split(",");
    }
  };

  pack = {
    Url: {},
    Thru: function(o) {
      return o;
    },
    Keys: function(val) {
      var item, key, list;
      list = (function() {
        var results;
        if (Array.isArray(val)) {
          return val;
        } else {
          results = [];
          for (key in val) {
            item = val[key];
            if (!item) {
              continue;
            }
            results.push(key);
          }
          return results;
        }
      })();
      return pack.Array(list.sort());
    },
    Array: function(val) {
      if (Array.isArray(val)) {
        return val.join(",");
      } else {
        return string_parser(val);
      }
    },
    Date: function(val) {
      var result, time;
      time = Math.floor(val);
      result = "";
      while (time >= 1) {
        result += serial.to_s[time % serial.size];
        time = Math.floor(time / serial.size);
      }
      return result;
    },
    Bool: function(bool) {
      if (bool) {
        return "T";
      } else {
        return "F";
      }
    },
    Text: symbol_serializer,
    Cookie: symbol_serializer,
    Url: url_serializer,
    Number: string_serializer,
    String: string_serializer,
    "null": string_serializer,
    undefined: string_serializer
  };

  unpack = {
    Url: {},
    Thru: function(o) {
      return o;
    },
    HtmlGon: function(html) {
      var codes, pattern, script;
      pattern = /<script.*?>([\s\S]*?)<\/script>/ig;
      codes = [];
      while (script = pattern.exec(html)) {
        codes.push(script[1]);
      }
      return new Function("window", codes.join("\n"));
    },
    Keys: function(val) {
      var bool, hash, i, key, len, list;
      hash = OBJ();
      if (val.length) {
        list = array_base_parser(val);
        for (i = 0, len = list.length; i < len; i++) {
          key = list[i];
          hash[key] = true;
        }
      } else {
        for (key in val) {
          bool = val[key];
          if (bool) {
            hash[key] = true;
          }
        }
      }
      return hash;
    },
    Array: function(val) {
      return array_base_parser(val);
    },
    Date: function(code) {
      var c, i, len, n, result;
      if (0 < code) {
        return code;
      }
      base = 1;
      result = 0;
      for (i = 0, len = code.length; i < len; i++) {
        c = code[i];
        n = serial.to_i[c];
        if (n == null) {
          return Number.NaN;
        }
        result += n * base;
        base *= serial.size;
      }
      return result;
    },
    Bool: function(val) {
      switch (val) {
        case true:
        case "T":
          return true;
        case false:
        case "F":
          return false;
        default:
          return Number.NaN;
      }
    },
    Text: symbol_parser,
    Cookie: symbol_parser,
    Url: symbol_parser,
    Number: Number,
    String: string_parser,
    "null": string_parser,
    undefined: string_parser
  };

  Serial = {
    url: {},
    ID: {
      now: function() {
        return Serial.ID.at(_.now());
      },
      at: function(date, count) {
        if (count == null) {
          count = Math.random() * patch_size;
        }
        return pack.Date(date * patch_size + count);
      }
    }
  };

  escaped = "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]*)";

  for (key in unpack) {
    func = unpack[key];
    Serial.url[key] = (function() {
      switch (key) {
        case "Number":
          return "([-]?[\\.0-9]+)";
        case "Date":
          return "([0-9a-zA-Z]+)";
        case "Array":
        case "Keys":
          return escaped;
        case "Url":
        case "Cookie":
          return escaped;
        case "Text":
          return escaped;
        default:
          return escaped;
      }
    })();
  }

  Mem = module.exports;

  Mem.pack = pack;

  Mem.unpack = unpack;

  Mem.Serial = Serial;

}).call(this);
