/**
 memory-record - activerecord like in-memory data manager
 @version v0.2.19
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
  var Mem, OBJ, f_clear, f_item, f_merge, f_remove, f_reset;

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

  f_clear = function() {
    return this.rule.finder.clear_cache();
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

    Collection.prototype.del = f_item(f_remove);

    Collection.prototype.remove = f_item(f_remove);

    Collection.prototype.clear_cache = f_clear;

    Collection.prototype.refresh = f_clear;

    Collection.prototype.rehash = f_clear;

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
    var i, id, item, len;
    switch (from != null ? from.constructor : void 0) {
      case Array:
        for (i = 0, len = from.length; i < len; i++) {
          item = from[i];
          process(item);
        }
        break;
      case Object:
        for (id in from) {
          item = from[id];
          item._id = id;
          process(item);
        }
        break;
      default:
        throw new Error("detect bad data: " + (JSON.stringify(from)));
    }
  };

  Mem = module.exports;

  Mem.Base.Finder = (function() {
    function Finder(model) {
      var all;
      this.model = model;
      all = Mem.Base.Query.build(this);
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

    Finder.prototype.clear_cache = function() {
      delete this.query.all._reduce;
      delete this.query.all._list;
      delete this.query.all._hash;
      this.query = {
        all: this.query.all
      };
    };

    Finder.prototype.save = function(query) {
      var chk, i, item, len, ref, results;
      ref = query.list;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push((function() {
          var j, len1, ref1, results1;
          ref1 = this.validates;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            chk = ref1[j];
            if (!chk(item)) {
              results1.push(this.model.save(item));
            }
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    Finder.prototype.calculate = function(query) {
      this.list(query, this.query.all._memory);
      if (query._list.length && this.model.do_map_reduce) {
        this.reduce(query);
        if (query._group != null) {
          this.group(query, query._group);
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
      var orderBy, ref, sortBy;
      ref = query._sort, sortBy = ref[0], orderBy = ref[1];
      if (sortBy != null) {
        return query._list = orderBy != null ? _.orderBy(query._list, sortBy, orderBy) : _.sortBy(query._list, sortBy);
      }
    };

    Finder.prototype.group = function(query) {
      var deploy, id, o, reduce, reduce_path, reduced, ref, target, target_path;
      ref = query._group, reduce = ref.reduce, target = ref.target;
      reduce_path = _.property(reduce);
      target_path = _.property(target);
      deploy = function(id, o) {
        query._memory[id] = o;
        return query._hash[id] = o.item;
      };
      query._memory = OBJ();
      query._hash = OBJ();
      return query._list = (function() {
        var ref1, results;
        ref1 = reduce_path(query._reduce);
        results = [];
        for (id in ref1) {
          reduced = ref1[id];
          o = target_path(reduced);
          results.push(deploy(o._id, o));
        }
        return results;
      })();
    };

    Finder.prototype.list = function(query, all) {
      var chk, deploy, every, id, o;
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
      query._hash = OBJ();
      return query._list = (function() {
        var i, j, len, len1, ref, ref1, ref2, results;
        ref1 = (ref = query._all_ids) != null ? ref : Object.keys(all);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          id = ref1[i];
          o = all[id];
          every = true;
          ref2 = query._filters;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            chk = ref2[j];
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
            _this.model["delete"](old.item);
            delete _memory[item._id];
          }
        };
      })(this));
      return this.clear_cache();
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
          this.model.update(item, old.item);
        } else {
          this.model["delete"](old);
        }
      }
      return this.clear_cache();
    };

    Finder.prototype.merge = function(from, parent) {
      var _memory;
      _memory = this.query.all._memory;
      this.model.do_map_reduce = false;
      each(from, (function(_this) {
        return function(item) {
          var chk, every, i, key, len, o, old, ref, val;
          item.__proto__ = _this.model.prototype;
          for (key in parent) {
            val = parent[key];
            item[key] = val;
          }
          _this.model.call(item, _this.model);
          if (!item._id) {
            throw new Error("detect bad data: " + (JSON.stringify(item)));
          }
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
            _this.model.map_reduce(item, function() {
              var cmd, j, keys;
              keys = 2 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 1) : (j = 0, []), cmd = arguments[j++];
              o.emits.push([keys, cmd]);
              return _this.model.do_map_reduce = true;
            });
            old = _memory[item._id];
            if (old != null) {
              _this.model.update(item, old.item);
            } else {
              _this.model.create(item);
              _this.model.rowid++;
            }
            _memory[item._id] = o;
          }
        };
      })(this));
      return this.clear_cache();
    };

    return Finder;

  })();

}).call(this);

(function() {
  var Mem;

  Mem = module.exports;

  Mem.Base.Model = (function() {
    Model.rowid = 0;

    Model.save = function(item) {};

    Model.update = function(item, old) {};

    Model.create = function(item) {};

    Model["delete"] = function(old) {};

    Model.validate = function(item) {
      return true;
    };

    Model.map_reduce = function(item, emit) {};

    function Model(m) {
      if (!this._id) {
        this._id = this[m.id];
      }
      if (!this[m.id]) {
        this[m.id] = this._id;
      }
    }

    return Model;

  })();

}).call(this);

(function() {
  var Mem, OBJ, _, query_parser, set_for,
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

  query_parser = function(base, req, cb) {
    var key, q, val;
    if (!req) {
      return base;
    }
    q = new Mem.Base.Query(base);
    q._filters = base._filters.concat();
    switch (req != null ? req.constructor : void 0) {
      case Object:
        for (key in req) {
          val = req[key];
          cb(q, key, val, _.property(key));
        }
        break;
      case Function:
      case Array:
      case String:
        cb(q, null, req, function(o) {
          return o;
        });
        break;
      default:
        console.log({
          req: req
        });
        throw Error('unimplemented');
    }
    return q;
  };

  Mem = module.exports;

  Mem.Base.Query = (function() {
    Query.build = function(_finder) {
      var _all_ids, _filters, _group, _sort, q;
      _all_ids = _group = null;
      _filters = [];
      _sort = [];
      q = new Mem.Base.Query({
        _finder: _finder,
        _all_ids: _all_ids,
        _group: _group,
        _filters: _filters,
        _sort: _sort
      });
      q._memory = OBJ();
      return q;
    };

    function Query(arg) {
      this._finder = arg._finder, this._all_ids = arg._all_ids, this._group = arg._group, this._filters = arg._filters, this._sort = arg._sort;
    }

    Query.prototype["in"] = function(req) {
      return query_parser(this, req, function(q, target, req, path) {
        var add, set;
        add = function(f) {
          return q._filters.push(f);
        };
        switch (req != null ? req.constructor : void 0) {
          case Array:
            set = set_for(req);
            return add(function(o) {
              var i, key, len, ref;
              ref = path(o);
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                if (set[key]) {
                  return true;
                }
              }
              return false;
            });
          case RegExp:
            return add(function(o) {
              var i, len, ref, val;
              ref = path(o);
              for (i = 0, len = ref.length; i < len; i++) {
                val = ref[i];
                if (req.test(val)) {
                  return true;
                }
              }
              return false;
            });
          case null:
          case Boolean:
          case String:
          case Number:
            return add(function(o) {
              return -1 < path(o).indexOf(req);
            });
          default:
            console.log({
              target: target,
              req: req,
              path: path
            });
            throw Error('unimplemented');
        }
      });
    };

    Query.prototype.where = function(req) {
      return query_parser(this, req, function(q, target, req, path) {
        var add, set;
        add = function(f) {
          return q._filters.push(f);
        };
        switch (req != null ? req.constructor : void 0) {
          case Function:
            return add(req);
          case Array:
            if ("_id" === target) {
              return q._all_ids = req;
            } else {
              set = set_for(req);
              return add(function(o) {
                return set[path(o)];
              });
            }
            break;
          case RegExp:
            return add(function(o) {
              return req.test(path(o));
            });
          case null:
          case Boolean:
          case String:
          case Number:
            if ("_id" === target) {
              return q._all_ids = [req];
            } else {
              return add(function(o) {
                return req === path(o);
              });
            }
            break;
          default:
            console.log({
              target: target,
              req: req,
              path: path
            });
            throw Error('unimplemented');
        }
      });
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
      var group, q;
      group = {
        reduce: reduce,
        target: target
      };
      if (_.isEqual(group, this._group)) {
        return this;
      }
      q = new Query(this);
      q._group = group;
      return q;
    };

    Query.prototype.sort = function() {
      var _sort, q;
      _sort = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (_.isEqual(_sort, this._sort)) {
        return this;
      }
      q = new Query(this);
      q._sort = _sort;
      return q;
    };

    Query.prototype.shuffle = function() {
      var q;
      q = new Query(this);
      q._sort = [Math.random];
      return q;
    };

    Query.prototype.clear = function() {
      delete this._reduce;
      delete this._list;
      delete this._hash;
      return delete this._memory;
    };

    Query.prototype.save = function() {
      return this._finder.save(this);
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
            this._finder.calculate(this);
          }
          return this._reduce;
        }
      },
      list: {
        get: function() {
          if (this._list == null) {
            this._finder.calculate(this);
          }
          return this._list;
        }
      },
      hash: {
        get: function() {
          if (this._hash == null) {
            this._finder.calculate(this);
          }
          return this._hash;
        }
      },
      memory: {
        get: function() {
          if (this._memory == null) {
            this._finder.calculate(this);
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
    }
  });

}).call(this);

(function() {
  var Mem, _, _rename, rename,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  _ = require("lodash");

  _rename = {};

  rename = function(base) {
    var id, ids, list, name;
    name = _rename[base];
    if (name) {
      return name;
    }
    id = base + "_id";
    ids = base + "_ids";
    list = base + "s";
    return _rename[list] = _rename[base] = {
      id: id,
      ids: ids,
      list: list,
      base: base
    };
  };

  Mem = module.exports;

  Mem.Rule = (function() {
    function Rule(base) {
      this.name = rename(base);
      this.depend_on(base);
      this.finder = new Mem.Base.Finder("_id");
      this.model = Mem.Base.Model;
      this.dml = new Mem.Base.Collection(this);
      this.inits = [];
    }

    Rule.prototype.schema = function(cb) {
      var i, init, len, ref;
      cb.call(this, this.dml);
      this.model.id = this.name.id;
      this.model.list = this.name.list;
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
      Mem.Model[this.name.base] = this.finder.model = this.model;
      Mem.Collection[this.name.base] = this.dml;
      Mem.Query[this.name.list] = this.finder.query.all;
      return this;
    };

    Rule.prototype.composite = function() {
      var f, i, len, ref;
      ref = Mem.Composite[this.name.base];
      for (i = 0, len = ref.length; i < len; i++) {
        f = ref[i];
        f();
      }
    };

    Rule.prototype.depend_on = function(parent) {
      var base1;
      if ((base1 = Mem.Composite)[parent] == null) {
        base1[parent] = [];
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

    Rule.prototype.relation_tree = function(key, ik, qk) {
      var all;
      all = this.finder.query.all;
      this.finder.use_cache(key, function(id, n) {
        var i, k, len, obj, obj1, q, ref;
        if (n) {
          q = all.where((
            obj = {},
            obj["" + ik] = id,
            obj
          ));
          ref = q.pluck(qk);
          for (i = 0, len = ref.length; i < len; i++) {
            k = ref[i];
            id.push(k);
          }
          return all[key](_.uniq(id), n - 1);
        } else {
          return all.where((
            obj1 = {},
            obj1["" + qk] = id,
            obj1
          ));
        }
      });
      return this.model.prototype[key] = function(n) {
        var id;
        id = [this[qk]];
        return all[key](id, n);
      };
    };

    Rule.prototype.relation_graph = function(key, ik, qk) {
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
      var dependent, key, name, ref, ref1, target;
      if (option == null) {
        option = {};
      }
      name = rename(to);
      key = (ref = option.key) != null ? ref : name.id, target = (ref1 = option.target) != null ? ref1 : name.list, dependent = option.dependent;
      this.relation_to_one(name.base, target, key);
      if (dependent) {
        this.depend_on(to);
        return this.finder.validate(function(o) {
          return o[to] != null;
        });
      }
    };

    Rule.prototype.has_many = function(to, option) {
      var ik, key, name, qk, ref, target;
      if (option == null) {
        option = {};
      }
      name = rename(to.replace(/s$/, ""));
      key = option.key, target = (ref = option.target) != null ? ref : name.list;
      switch (option.by) {
        case "ids":
          ik = key != null ? key : name.ids;
          qk = "_id";
          break;
        default:
          ik = "_id";
          qk = key != null ? key : this.name.id;
      }
      return this.relation_to_many(name.list, target, ik, qk);
    };

    Rule.prototype.tree = function(option) {
      if (option == null) {
        option = {};
      }
      this.relation_tree("nodes", this.name.id, "_id");
      return this.belongs_to(this.name.base, option);
    };

    Rule.prototype.graph = function(option) {
      var cost, directed, ik;
      if (option == null) {
        option = {};
      }
      directed = option.directed, cost = option.cost;
      ik = this.name.ids;
      this.relation_to_many(this.name.list, this.name.list, ik, "_id");
      this.relation_graph("path", ik, "_id");
      if (!directed) {
        return true;
      }
    };

    Rule.prototype.shuffle = function() {
      var query;
      query = this.finder.query.all.shuffle();
      query._memory = this.finder.query.all._memory;
      return Mem.Query[this.name.list] = this.finder.query.all = query;
    };

    Rule.prototype.sort = function(sortBy) {
      return this.order(sortBy);
    };

    Rule.prototype.order = function(sortBy, orderBy) {
      var query;
      query = this.finder.query.all.sort(sortBy, orderBy);
      query._memory = this.finder.query.all._memory;
      return Mem.Query[this.name.list] = this.finder.query.all = query;
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
