'use strict';
var Deduper = require('deduper');
var browserify = require('browserify');
var through = require('through');

browserify().constructor.prototype.dedupeBundle = function (opts, cb) {
  opts = opts || {};
  var deduper = new Deduper();
  var criteria = opts.dedupeCriteria || 'any';
  var passThru = through();
  var self = this;

  var deduping;
  self
    .on('package', function (file, pack) {
      if (pack && Object.keys(pack).length) {
        deduper.dedupe(criteria, file, pack);
      }
    })
    .bundle(opts, function (err, res) {
      if (deduping) return;
      if (err) return console.error('error', err);

      deduping = true;

      Object.keys(deduper.cache)
        .forEach(function (k) {
          var deps = deduper.cache[k];
          var dep = deps[0];
          if (deps.length > 1) {
            var versions = deps.map(function (d) {
              return d.pack.version;
            }).join(', ');
            return self.emit('cannot-dedupe', dep.pack.name, versions);
          }

          self.require(dep.id, { expose: dep.pack.name });
        });

      self.bundle(opts, cb).pipe(passThru);
    });

    return passThru;
};

var entry = require.resolve('./test/fixtures/');
browserify()
  .require(entry, { entry: true })
  .on('cannot-dedupe', function (d, versions) { 
    console.warn('cannot dedupe "%s" because I found incompatible versions: ', d, versions); 
  })
  .dedupeBundle({ dedupeCriteria: 'any' }, function (err, res) {
    eval(res);
  });
 /*.dedupeBundle()
 .pipe(process.stdout);*/
