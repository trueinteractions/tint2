module.exports = (function() {
  var $ = process.bridge.objc;
  var TextInput = require('TextInput');

  function SearchInput(NativeObjectClass, NativeViewClass, options)  {
    options = options || {};

    if(NativeObjectClass && NativeObjectClass.type == '#')
      TextInput.call(this, NativeObjectClass, NativeViewClass, options);
    else
      TextInput.call(this, $.NSSearchField, $.NSSearchField, options);
  }

  SearchInput.prototype = Object.create(TextInput.prototype);
  SearchInput.prototype.constructor = SearchInput;

  return SearchInput;

})();