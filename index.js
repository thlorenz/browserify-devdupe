'use strict';

var through = require('through');
var Deduper = require('deduper');
var resolve = require('resolve-redirects');
var path = require('path');


function modulePath (fullPath) {
  var parts = fullPath.split(path.sep);
  var p, lastNodeModules;

  for (var i = 0; i < parts.length; i++) {
    p = parts[i];
    if (p === 'node_modules') lastNodeModules = i;
  }

  return parts.slice(0, lastNodeModules + 2).join(path.sep);
}

function isMain (file) {
  var mp = modulePath(file);
  try { 
    var pack = require(path.join(mp, 'package.json'));
    var main = pack.browser || pack.browserify || pack.main || 'index';
    var resolved = path.resolve(mp, main);
    return resolved === file;
  } catch (err) {
    return false;
  }
}

/**
 * Adds deduping behavior based on the given criteria to the browserify instance.
 * 
 * @name exports
 * @function
 * @param bfy {Object} browserify instance (i.e. result of `browserify()`)
 * @param criteria {String} exact | patch | minor | major | any 
 * @return {Object} the browserify instance with added behavior
 */
var go = module.exports = function (bfy, criteria) {
  criteria = criteria || 'minor';
  var replaceDeps = {};
  var deduper = new Deduper();

  bfy.on('package', function (file, pack) {
    if (pack && Object.keys(pack).length) {
      var dd = deduper.dedupe(criteria, file, pack);
      
      if (dd.replacesId) {
        replaceDeps[dd.replacesId] = file;
      } else if (dd.id !== file && isMain(file))
        replaceDeps[file] = dd.id;
      } 
  });

  var bfy_deps = bfy.deps.bind(bfy);
  bfy.deps = function () {
    var self = this;
    replaceDeps = {};

    var deps = [];
    var depStream = bfy_deps.apply(bfy, arguments);

    return depStream.pipe(through(write, end));
    
    function write (d) { deps.push(d); }
    function end () {
      replaceDeps = resolve(replaceDeps);

      deps.forEach(function (dep) {
        // drop deps that have been replaced so they won't get bundled
        if (replaceDeps[dep.id]) { 
          self.emit('deduping', dep.id);
          return;
        }
        
        Object.keys(dep.deps).forEach(function (k) {
          var current = dep.deps[k];
          var replacement = replaceDeps[current];
          if (replacement) dep.deps[k] = replacement;
        })
        this.queue(dep);
      }.bind(this));

      this.queue(null);
    }
  };

  return bfy;
};
