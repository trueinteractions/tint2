module.exports = (function() {
  if(global.__TINT.SecureTextInput) {
    return global.__TINT.SecureTextInput;
  }
  var $ = process.bridge.objc;
  var util = require('Utilities');
  var TextInput = require('TextInput');

  /**
   * @class SecureTextInput
   * @description Creates a secure text label or text input area for the user to
   *              provide a free-form value from the keyboard. This inherits all of the TextInput capabilities.
   * @extends TextInput
   */

  /**
   * @new
   * @memberof SecureTextInput
   * @description Creates a new SecureTextInput control.
   */
  function SecureTextInput(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.NSSecureTextField;
    this.nativeViewClass = this.nativeViewClass || $.NSSecureTextField;
    TextInput.call(this, options);
  }
  SecureTextInput.prototype = Object.create(TextInput.prototype);
  SecureTextInput.prototype.constructor = SecureTextInput;

  global.__TINT.SecureTextInput = SecureTextInput;
  return SecureTextInput;
})();