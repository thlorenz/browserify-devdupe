'use strict';
var through = require('through');
var pipeline = require('pipeline');
var Deduper = require('deduper');


var browserify = require('browserify');
var entry = require.resolve('./test/fixtures/');
var deduper = new Deduper();

var bfy = browserify().require(entry, { entry: true });
var replaceDeps = [];

bfy.on('package', function (file, pack) {
  if (pack && Object.keys(pack).length) {
    var dd = deduper.dedupe('major', file, pack);
    
    if (dd.replacesId) {
      replaceDeps.push({ id: dd.replacesId, withId: file });
    } else if (dd.id !== file) {
      replaceDeps.push({ id: file, withId: dd.id });
    }
  }
});

function inspect(obj, depth) {
  console.log(require('util').inspect(obj, false, depth || 5, true));
}

var bfy_pack = bfy.pack.bind(bfy);
bfy.pack = function (debug, standalone) {
  var deps = [];
  var pack = bfy_pack(debug, standalone);

  // this never calls my write and/or end methods, but instead just goes straight to the pack stream
  return pipeline(through(write, end), pack);

  // this does wtf?
  //return through(write, end);

  
  function write (d) { deps.push(d); }
  function end () {
    inspect(replaceDeps);

    deps.forEach(function (d) {
      this.queue(d);
    }.bind(this));
    this.queue(null);
  }
};

bfy.bundle(function (err, res) {
  if (err) return console.error(err);
  console.log(res);
});
