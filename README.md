# browserify-dedupe [![build status](https://secure.travis-ci.org/thlorenz/browserify-dedupe.png)](http://travis-ci.org/thlorenz/browserify-dedupe)

Dedupes packages included in a browserify bundle according to a given criteria.

## Warning

Don't use this in production - hence the name - instead you should [`npm
dedupe`](https://npmjs.org/doc/cli/npm-dedupe.html) your package and run the normal browserify instead.

**browserify-dedupe** is solely in existance to solve one problem: `npm dedupe` does not work with linked sub modules. 

So **if you don't plan to use `npm link` or `ln -s`** in your development process **this is not for you** and you can stop
reading now. At the same token if you are sure that all libraries that need to be deduped have the same version you will
also not need this since **browserify@2.29.0 already dedupes modules with exact same file content**.

While [dynamic-dedupe](https://github.com/thlorenz/dynamic-dedupe) solves dedupe breaking for server side modules as long as they have
the exact same versions, **browserify-dedupe** does the same for modules bundled with browserify, except that it allows
you to give a [dedupe-criteria](#criteria). Therefore if you need all your dependencies to always pull in exactly one
instance of a library i.e. backbone, you can use **browserify-dedupe** to redirect all modules depending on older
versions to the latest common denominator.

```js
var browserify = require('browserify')
  , devdupe = require('browserify-devdupe')
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
```

### Output:

```
patch

loading common 0.1.0
loading common 0.1.5
loading common 0.2.0
loading common 1.0.0
depends-0.1.0 - common common-0.1.0
also-depends-0.1.0 - common common-0.1.0
depends-0.1.5 - common dep - common-0.1.5
depends-0.2.0 - common common-0.2.0
depends-1.0.0 - common common-1.0.0

major

loading common 0.2.0
loading common 1.0.0
depends-0.1.0 - common dep - common-0.1.5
also-depends-0.1.0 - common dep - common-0.1.5
depends-0.1.5 - common common-0.2.0
depends-0.2.0 - common common-0.2.0
depends-1.0.0 - common common-1.0.0

any

loading common 1.0.0
depends-0.1.0 - common common-1.0.0
also-depends-0.1.0 - common common-1.0.0
depends-0.1.5 - common common-1.0.0
depends-0.2.0 - common common-1.0.0
depends-1.0.0 - common common-1.0.0
```

## Installation

    npm install browserify-dedupe

## API

###*devdupe(browserifyInstance, criteria = 'minor')*

```
/**
 * Adds deduping behavior based on the given criteria to the browserify instance.
 * 
 * @name exports
 * @function
 * @param bfy {Object} browserify instance (i.e. result of `browserify()`)
 * @param criteria {String} exact | patch | minor | major | any 
 * @return {Object} the browserify instance with added behavior
 */
```

#### criteria

- **exact** versions have to be equal
- **patch** *major* and *minor*  and *patch* numbers have to be equal, *alpha*, *beta* suffixes may vary
- **minor** *major* and *minor* numbers have to be equal, *patch* number may vary
- **major** *major* number has to be equal, *minor* and *patch* numbers may vary
- **any** versions are not considered

## License

MIT
