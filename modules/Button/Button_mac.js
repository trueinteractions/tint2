module.exports = (function() {
  if(global.__TINT.Button) {
    return global.__TINT.Button;
  }
  var util = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  /**
   * @class Button
   * @description Creates a button for the user to active or indicate status or steps.
   * @extends Container
   */
   /**
    * @new
    * @memberof Button
    * @description Creates a new Button control.
    */
  function Button(options) {
    options = options || {};
    options.mouseDownBlocks = true;
    this.nativeClass = this.nativeClass || $.NSButton;
    this.nativeViewClass = this.nativeViewClass || $.NSButton;
    Container.call(this, options);
    this.private.img = null;
    this.private.buttonStyle = this.private.buttonType = "normal";
    this.native('setButtonType',$.NSMomentaryLightButton);
    this.native('setBezelStyle',$.NSTexturedRoundedBezelStyle);
    this.native('cell')('setWraps',$.NO);
    this.native('setTitle', $(""));
  }

  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  /**
   * @member border
   * @type {boolean}
   * @memberof Button
   * @description Gets or sets whether the button has a border around it.
   * @default true
   */
  util.makePropertyBoolType(Button.prototype, 'border', 'isBordered', 'setBordered');

  /**
   * @member state
   * @type {boolean}
   * @memberof Button
   * @description Gets or sets whether the button is "on" or "off". This has different
   *              meanings depending on the type of button, for radio, checkbox and 
   *              toggle type buttons this changes its visual style. This has no meaning
   *              (visually) for normal buttons. The default is false.
   * @default false
   */
  util.def(Button.prototype, 'state',
    function() { return this.nativeView('state') === $.NSOnState ? true : false; },
    function(e) { return this.nativeView('setState', e === true ? $.NSOnState : $.NSOffState); }
  );

  /**
   * @member title
   * @type {string}
   * @memberof Button
   * @description Gets or sets the text label on the button.
   */
  util.def(Button.prototype, 'title',
    function() { return this.nativeView('title').toString(); },
    function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['title', e]);

      if(e.toString() === "") {
        this.nativeView('cell')('setImagePosition', $.NSImageOnly);
      } else {
        this.nativeView('cell')('setImagePosition', $.NSImageLeft);
      }
      this.nativeView('setTitle', $(e));
    }
  );

  /**
   * @member type
   * @type {string}
   * @memberof Button
   * @description Gets or sets the type of button, this can be 
   *              "toggle", "checkbox", "radio" or "normal".
   */
  util.def(Button.prototype, 'type',
    function() { return this.private.buttonType; },
    function(type) {
      this.private.buttonType = type;
      
      if (type === "toggle") {
        this.nativeView('setButtonType',$.NSPushOnPushOffButton);
      } else if (type === "checkbox") {
        this.nativeView('setButtonType', $.NSSwitchButton);
      } else if (type === "radio") {
       this.nativeView('setButtonType', $.NSRadioButton);
      } else {
        this.nativeView('setButtonType',$.NSMomentaryLightButton);
      }
      // no complement on other systems.
      //else if (type == "none") this.nativeView('setButtonType', $.NSMomentaryPushInButton);
    }
  );

  // TODO: Not supported on Win, perhaps investigate differences in behavior and replicate?
  util.def(Button.prototype, 'showBorderOnHover',
    function() { return this.nativeView('showsBorderOnlyWhileMouseInside') ? true : false; },
    function(e) { this.nativeView('setShowsBorderOnlyWhileMouseInside', e ? true : false ); }
  );

  /**
   * @member enabled
   * @type {string}
   * @memberof Button
   * @description Gets or sets the buttons availability and visual presentation to the user.
   *              When set to false the button is grayed out and does not respond to clicks.
   *              The default is true.
   * @default true
   */
  util.def(Button.prototype, 'enabled',
    function() { return this.nativeView('isEnabled'); },
    function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['enabled', e]);
      return this.nativeView('setEnabled',e); 
    }
  );

  /**
   * @member image
   * @type {string}
   * @memberof Button
   * @description Gets or sets the associated image to be displayed on the button.  This can be
   *              a named icon resource for the OS, or a URL to an image (including the app:// schema).
   */
  util.def(Button.prototype, 'image',
    function() { return this.private.img; },
    function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['image', e]);
      this.private.img = e;
      e = util.makeNSImage(e);
      if(e) {
        this.nativeView('setImage', e);
        if(this.nativeView('title').toString() === "") {
          this.nativeView('cell')('setImagePosition', $.NSImageOnly);
        } else {
          this.nativeView('cell')('setImagePosition', $.NSImageLeft);
        }
        this.nativeView('cell')('setImageScaling',$.NSImageScaleProportionallyDown);
      }
    }
  );

  global.__TINT.Button = Button;
  return Button;

})();
