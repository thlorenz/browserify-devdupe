'use strict';
/*jshint asi: true */

var debug //=  true;
var test  =  debug  ? function () {} : require('tap').test
var test_ =  !debug ? function () {} : require('tap').test

var vm         =  require('vm')
  , path       =  require('path')
  , dedupe     =  require('../')

function inspect(obj, depth) {
  console.log(require('util').inspect(obj, false, depth || 5, true));
}

function setupVm () {
  var buf = [];
  var ctx = { console: { log: function (s, arg) { buf.push(s + (arg ? ' ' + arg : '')) } } };
  return { ctx: ctx, buf: buf };
}

function check (t, criteria, entries, output, dedupes) {
  var browserify =  require('browserify')

  var bfy = browserify();
  var setup = setupVm();
  var deduped = [];

  entries.forEach(function (e) { bfy.require(e, { entry: true }) });
  dedupe(bfy, criteria)
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

test('\nrequireing two same version dependents - patch', function (t) {
  check(t
    , 'minor'
    , [ require.resolve('./fixtures/depends-0.1.0')
      , require.resolve('./fixtures/also-depends-0.1.0')
      ]
    , [ 'loading common 0.1.0' ]
    , [ 'also-depends-0.1.0/node_modules/common/common.js' ]
  )
})

test('\nrequireing one dependent only - patch', function (t) {
  check(t
    , 'patch'
    , [ require.resolve('./fixtures/depends-0.1.0') ]
    , [ 'loading common 0.1.0' ]
    , []
  )
})

test('\nrequireing two dependents{0.1.0,0.1.5} - patch', function (t) {
  check(t
    , 'patch'
    , [ require.resolve('./fixtures/depends-0.1.0')
      , require.resolve('./fixtures/depends-0.1.5')
      ]
    , [ 'loading common 0.1.0'
      , 'loading common 0.1.5' ]
    , []
  )
})

test('\nrequireing two dependents{0.1.0,0.1.5} - minor', function (t) {
  check(t
    , 'minor'
    , [ require.resolve('./fixtures/depends-0.1.0')
      , require.resolve('./fixtures/depends-0.1.5')
      ]
    , [ 'loading common 0.1.5' ]
    , [ 'depends-0.1.0/node_modules/common/common.js' ]
  )
})

test('\nrequireing three dependents{0.1.0,0.1.5,0.2.0} - minor', function (t) {
  check(t
    , 'minor'
    , [ require.resolve('./fixtures/depends-0.1.0')
      , require.resolve('./fixtures/depends-0.1.5')
      , require.resolve('./fixtures/depends-0.2.0')
      ]
   ,  [ 'loading common 0.1.5',
        'loading common 0.2.0' ]
   ,  [ 'depends-0.1.0/node_modules/common/common.js' ]
  )
})

test('\nrequireing three dependents{0.1.0,0.1.5,0.2.0} - major - does not dedupe dep.js', function (t) {
  check(t
    , 'major'
    , [ require.resolve('./fixtures/depends-0.1.0')
      , require.resolve('./fixtures/depends-0.1.5')
      , require.resolve('./fixtures/depends-0.2.0')
      ]
   ,  [ 'loading common 0.2.0' ]
   ,  [ 'depends-0.1.0/node_modules/common/common.js',
        'depends-0.1.5/node_modules/common/common.js' ]
  )
})
