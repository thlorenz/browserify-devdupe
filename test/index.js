'use strict';
/*jshint asi: true */

var debug// =  true;
var test  =  debug  ? function () {} : require('tap').test
var test_ =  !debug ? function () {} : require('tap').test

var browserify =  require('browserify')
  , vm         =  require('vm')
  , path       =  require('path')
  , entry      =  require.resolve('./fixtures/')
  , dedupe     =  require('../')

function inspect(obj, depth) {
  console.log(require('util').inspect(obj, false, depth || 5, true));
}

function setupVm () {
  var buf = [];
  var ctx = { console: { log: function (s, arg) { buf.push(s + (arg ? ' ' + arg : '')) } } };
  return { ctx: ctx, buf: buf };
}

function check (t, criteria, output, dedupes) {

  var bfy = browserify();
  var setup = setupVm();
  var deduped = [];

  dedupe(bfy, criteria)
    .require(entry, { entry: true }) 
    .on('deduping', function (d) { deduped.push(d.split(path.sep).slice(-4).join(path.sep)) })
    .bundle(function (err, src) {
      if (err) return t.fail(err);
      vm.runInNewContext(src, setup.ctx);

      t.deepEqual(setup.buf, output, 'loads correct versions')
      t.equal(deduped.length, dedupes.length, 'correct number of dedupes')
      deduped.forEach(function (d) { t.ok(~dedupes.indexOf(d), 'correct dedupe') })

      /*inspect(setup.buf);
      inspect(deduped);*/
      t.end()
    });
}

test('\nexact - loads all ( 0.1.0, 0.1.5, 0.2.0, 1.0.0 ) common versions and dedupes one that is found twice with exact same version', function (t) {
  check(t
    , 'patch'
    , [ 'loading common 0.1.0',
        'loading common 0.1.5',
        'loading common 0.2.0',
        'loading common 1.0.0',
        'depends-0.1.0 - common common-0.1.0',
        'also-depends-0.1.0 - common common-0.1.0',
        'depends-0.1.5 - common dep - common-0.1.5',
        'depends-0.2.0 - common common-0.2.0',
        'depends-1.0.0 - common common-1.0.0' ]
    , [ 'also-depends-0.1.0/node_modules/common/common.js' ]
  )
})

test('\npatch- loads all ( 0.1.0, 0.1.5, 0.2.0, 1.0.0 ) common versions and dedupes one that is found twice with exact same version', function (t) {
  check(t
    , 'patch'
    , [ 'loading common 0.1.0',
        'loading common 0.1.5',
        'loading common 0.2.0',
        'loading common 1.0.0',
        'depends-0.1.0 - common common-0.1.0',
        'also-depends-0.1.0 - common common-0.1.0',
        'depends-0.1.5 - common dep - common-0.1.5',
        'depends-0.2.0 - common common-0.2.0',
        'depends-1.0.0 - common common-1.0.0' ]
    , [ 'also-depends-0.1.0/node_modules/common/common.js' ]
  )
})

test('\nminor - loads 0.1.5, 0.2.0, 1.0.0 - not 0.1.0 and dedupes 0.1.0 wherever it was referenced with 0.1.5', function (t) {
  check(t
    , 'minor'
    , [ 'loading common 0.1.5',
        'loading common 0.2.0',
        'loading common 1.0.0',
        'depends-0.1.0 - common dep - common-0.1.5',
        'also-depends-0.1.0 - common dep - common-0.1.5',
        'depends-0.1.5 - common dep - common-0.1.5',
        'depends-0.2.0 - common common-0.2.0',
        'depends-1.0.0 - common common-1.0.0' ]
    , [ 'depends-0.1.0/node_modules/common/common.js',
        'also-depends-0.1.0/node_modules/common/common.js' ]
  )
})

test('\nmajor - loads 0.2.0, 1.0.0 - not 0.1.0, 0.1.5  and dedupes 0.1.0 and 0.1.5 wherever referenced with 0.2.0', function (t) {
  check(t
    , 'major'
    , [ 'loading common 0.2.0',
        'loading common 1.0.0',
        'depends-0.1.0 - common common-0.2.0',
        'also-depends-0.1.0 - common common-0.2.0',
        'depends-0.1.5 - common common-0.2.0',
        'depends-0.2.0 - common common-0.2.0',
        'depends-1.0.0 - common common-1.0.0' ]
    , [ 'depends-0.1.0/node_modules/common/common.js',
        'also-depends-0.1.0/node_modules/common/common.js',
        'depends-0.1.5/node_modules/common/common.js',
        'depends-0.1.5/node_modules/common/dep.js' ]  )
})

test('\nany - loads 1.0.0 only and dedupes 0.1.0, 0.1.5, 0.2.0 wherever referenced with 1.0.0', function (t) {
  check(t
    , 'any'
    , [ 'loading common 1.0.0',
        'depends-0.1.0 - common common-1.0.0',
        'also-depends-0.1.0 - common common-1.0.0',
        'depends-0.1.5 - common common-1.0.0',
        'depends-0.2.0 - common common-1.0.0',
        'depends-1.0.0 - common common-1.0.0' ]
    , [ 'depends-0.1.0/node_modules/common/common.js',
        'depends-0.2.0/node_modules/common/common.js',
        'also-depends-0.1.0/node_modules/common/common.js',
        'depends-0.1.5/node_modules/common/common.js',
        'depends-0.1.5/node_modules/common/dep.js' ]  
    )
})
