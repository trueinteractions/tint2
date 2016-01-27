module.exports = (function() {
  if(global.__TINT.SecureTextInput) {
    return global.__TINT.SecureTextInput;
  }
  var $ = process.bridge.dotnet;
  var TextInput = require('TextInput');
  var util = require('Utilities');

  function SecureTextInput(properties, options, inherited) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.PasswordBox;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.PasswordBox;
    TextInput.call(this, properties, options);
    // textChanged was defined in TextInput.
    this.native.addEventListener('PasswordChanged', this.private.textChanged);
    util.setProperties(this, properties, inherited);
  }
  SecureTextInput.prototype = Object.create(TextInput.prototype);
  SecureTextInput.prototype.constructor = SecureTextInput;

  Object.defineProperty(SecureTextInput.prototype, 'value', {
    get:function() { return this.native.Password; },
    set:function(e) { this.native.Password = e.toString(); }
  });

  global.__TINT.SecureTextInput = SecureTextInput;
  return SecureTextInput;
})();