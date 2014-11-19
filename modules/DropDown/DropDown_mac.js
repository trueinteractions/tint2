module.exports = (function() {
  var Button = require('Button');
  var $ = process.bridge.objc;
  /**
   * @class DropDown
   * @description Creates a pop-up button that shows a set of menu options when pressed. 
   * @extends Container
   * @see Menu
   */
  function DropDown() {
    Button.call(this, $.NSPopUpButton, $.NSPopUpButton, {mouseDownBlocks:true,keyDownBlocks:true});
    this.private.menu = null;
  }

  DropDown.prototype = Object.create(Button.prototype);
  DropDown.prototype.constructor = DropDown;


  /**
   * @member pullsdown
   * @type {boolean}
   * @memberof DropDown
   * @description Gets or sets whether the menu should pull down below the button or 
   *              pop over the button.  The default is false.
   * @default false
   */
  Object.defineProperty(DropDown.prototype, 'pullsdown', {
    get:function() { return this.nativeView('pullsDown') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setPullsDown', e ? $.YES : $.NO); }
  });

  /**
   * @member options
   * @type {Menu}
   * @memberof DropDown
   * @description Gets or sets the menu or options that the user can select from when
   *              the button is pressed.
   */
  Object.defineProperty(DropDown.prototype, 'options', {
    get:function() { return this.private.menu; },
    set:function(e) {
      this.private.menu = e;
      this.native('setMenu',this.private.menu.native);
    }
  });

  /**
   * @member value
   * @type {string}
   * @memberof DropDown
   * @description Gets or sets the shown title label on the button.
   */
  Object.defineProperty(DropDown.prototype, 'value', {
    get:function() { return this.nativeView('titleOfSelectedItem')('UTF8String'); },
    set:function(e) { this.nativeView('setTitle', $(e)); }
  });

  return DropDown;
})();