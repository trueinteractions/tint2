module.exports = (function() {
  var $ = process.bridge.dotnet;
  var TextInput = require('TextInput');

  function SearchInput(options)  {
    throw new Error('Not implemented.');
  }

  SearchInput.prototype = Object.create(TextInput.prototype);
  SearchInput.prototype.constructor = SearchInput;

  Object.defineProperty(SearchInput.prototype, 'searches', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(SearchInput.prototype, 'searchButton', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(SearchInput.prototype, 'cancelButton', {
    get:function() { },
    set:function(e) { }
  });

  return SearchInput;

})();