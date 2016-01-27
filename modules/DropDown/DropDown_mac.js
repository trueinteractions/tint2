module.exports = (function() {
  var Button = require('Button');
  var util = require('Utilities');
  var $ = process.bridge.objc;
  /**
   * @class DropDown
   * @description Creates a pop-up button that shows a set of menu options when pressed. 
   * @extends Container
   * @see Menu
   */
   /**
    * @new
    * @memberof DropDown
    * @description Creates a new DropDown control.
    */
  function DropDown(properties, options, inherited) {
    options = options || {};
    options.delegates = options.delegates || [];
    options.mouseDownBlocks = true;
    options.keyDownBlocks = true;
    this.nativeClass = this.nativeClass || $.NSPopUpButton;
    this.nativeViewClass = this.nativeViewClass || $.NSPopUpButton;
    Button.call(this, properties, options, inherited || true);
    this.private.menu = null;
    util.setProperties(this, properties, inherited);
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
  util.makePropertyBoolType(DropDown.prototype, 'pullsdown', 'pullsDown', 'setPullsDown');

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
  util.makePropertyStringType(DropDown.prototype, 'value', 'titleOfSelectedItem', 'setTitle');

  return DropDown;
})();