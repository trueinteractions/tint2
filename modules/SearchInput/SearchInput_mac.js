module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Control = require('Control');
  var TextInput = require('TextInput');

  function SearchInput(NativeObjectClass, NativeViewClass, options)  {
    options = options || {};

    if(NativeObjectClass && NativeObjectClass.type == '#')
      TextInput.call(this, NativeObjectClass, NativeViewClass, options);
    else
      TextInput.call(this, $.NSSearchField, $.NSSearchField, options);

    this.private.searchButton = null;
    this.private.cancelButton = null;

    this.native('setRecentsAutosaveName',$(application.name));
  }

  SearchInput.prototype = Object.create(TextInput.prototype);
  SearchInput.prototype.constructor = SearchInput;

  Object.defineProperty(SearchInput.prototype, 'searches', {
    get:function() { return utilities.nsArrayToArray(this.nativeView('recentSearches')); },
    set:function(e) {
      if(!Array.isArray(e)) throw new Error('Searches expected an array of strings.');
      this.nativeView('setRecentSearches',utilities.arrayToNSArray(e));
    }
  });

  Object.defineProperty(SearchInput.prototype, 'searchButton', {
    get:function() { return this.private.searchButton; },
    set:function(e) {
      if(e instanceof Control) {
        this.private.searchButton = e;
        this.nativeView('cell')('setSearchButtonCell',e.nativeView('cell'));
      } else
        throw new Error('The search button must be an instance (or derived work) of a Button.');
    }
  });

  Object.defineProperty(SearchInput.prototype, 'cancelButton', {
    get:function() { return this.private.cancelButton; },
    set:function(e) {
      if(e instanceof Control) {
        this.private.cancelButton = e;
        this.nativeView('cell')('setCancelButtonCell',e.nativeView('cell'));
      } else
        throw new Error('The cancel button must be an instance (or derived work) of a Button.');
    }
  });

  return SearchInput;

})();