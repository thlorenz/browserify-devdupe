
function performDedupe (replaceDeps) {
  var deps = [];
  
  return through(ondep, onend);

  function ondep (d) { deps.push(d); }
  function onend () {
    deps.forEach(function (dep) {
      // drop deps that have been replaced so they won't get bundled
      if (replaceDeps[dep.id]) return;
      
      Object.keys(dep.deps).forEach(function (k) {
        var current = dep.deps[k];
        var replacement = replaceDeps[current];
        if (replacement) dep.deps[k] = replacement;
      });

      this.queue(dep);
    }.bind(this));

    this.queue(null);
  }
}

