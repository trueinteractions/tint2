module.exports = (function() {
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');
  var Control = require('Control');
  var TextInput = require('TextInput');

  function SearchInput(NativeObjectClass, NativeViewClass, options)  {
    options = options || {};

    if(NativeObjectClass)
      TextInput.call(this, NativeObjectClass, NativeViewClass, options);
    //else
    //  TextInput.call(this, $.NSSearchField, $.NSSearchField, options);

    this.private.searchButton = null;
    this.private.cancelButton = null;

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