module.exports = (function() {
  if(global.__TINT.SearchInput) {
    return global.__TINT.SearchInput;
  }
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Control = require('Control');
  var TextInput = require('TextInput');

  function SearchInput(options) {
    options = options || {};
    options.delegates = options.delegates || [];
    this.nativeClass = this.nativeClass || $.NSSearchField;
    this.nativeViewClass = this.nativeViewClass || $.NSSearchField;
    TextInput.call(this, options);
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

  global.__TINT.SearchInput = SearchInput;
  return SearchInput;

})();