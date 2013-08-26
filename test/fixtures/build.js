var browserify = require('../browserify');

console.error('\033[2J'); // clear console
console.error('==================================================');
browserify()
  .require(require.resolve('./foo'), { entry: true })
  .bundle(function (err, bundle) {
    if (err) return console.error(err);
    console.log('\n\n=================================\n\n');
    console.log(bundle.split('\n').slice(1).join('\n'));
    eval(bundle); 
  });
