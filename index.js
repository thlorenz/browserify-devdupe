'use strict';
var Deduper = require('deduper');

var browserify = require('browserify');
var entry = require.resolve('./test/fixtures/');
var deduper = new Deduper();

var bfy = browserify().require(entry, { entry: true });

bfy.on('package', function (file, pack) {
  if (pack && Object.keys(pack).length) {
    deduper.dedupe('any', file, pack);
  }
});

function inspect(obj, depth) {
  console.log(require('util').inspect(obj, false, depth || 5, true));
}

var secondPass = false;
bfy.bundle(function (err, res) {
  if (secondPass) return;

  if (err) return console.error(err);

  Object.keys(deduper.cache)
    .forEach(function (k) {
      var dep = deduper.cache[k][0];
      if (dep.length > 1) return console.warn('cannot dedupe %s b/c I found incompatible versions', dep[0].pack.name);
      bfy.emit('deduping', dep);
      bfy.require(dep.id, { expose: dep.pack.name });
    });

  secondPass = true;
  bfy.bundle(function (err, res) {
    eval(res)
  });
});
