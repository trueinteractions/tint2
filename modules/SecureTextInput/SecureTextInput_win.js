module.exports = (function() {
  if(global.__TINT.SecureTextInput) {
    return global.__TINT.SecureTextInput;
  }
  var $ = process.bridge.dotnet;
  var TextInput = require('TextInput');

  function SecureTextInput(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.PasswordBox;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.PasswordBox;
    TextInput.call(this, options);
    // textChanged was defined in TextInput.
    this.native.addEventListener('PasswordChanged', this.private.textChanged);
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