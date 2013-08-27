'use strict';

var browserify = require('browserify')
  , devdupe = require('../')
  , entry = require.resolve('../test/fixtures/');

devdupe(browserify(), 'patch')
  .require(entry, { entry: true })
  .bundle(function (err, src) { 
    console.log('\npatch\n');
    eval(src); 
  });

devdupe(browserify(), 'major')
  .require(entry, { entry: true })
  .bundle(function (err, src) { 
    console.log('\nmajor\n');
    eval(src); 
  });

devdupe(browserify(), 'any')
  .require(entry, { entry: true })
  .bundle(function (err, src) { 
    console.log('\nany\n');
    eval(src); 
  });


// Note: eval is evil except in some cases (like simple examples)
