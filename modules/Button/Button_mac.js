module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  /**
   * @class Button
   * @description Creates a button for the user to active or indicate status or steps.
   * @extends Container
   */
  function Button(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.mouseDownBlocks = true;

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSButton, $.NSButton, options);

    this.private.img = null;
    this.private.buttonType = "normal";
    this.private.buttonStyle = "normal";

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setButtonType',$.NSMomentaryLightButton);
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
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
  Object.defineProperty(Button.prototype, 'border', {
    get:function() { return this.nativeView('isBordered') == $.YES ? true : false; },
    set:function(e) { return this.nativeView('setBordered', e === true ? $.YES : $.NO); }
  });

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
  Object.defineProperty(Button.prototype, 'state', {
    get:function() { return this.nativeView('state') === $.NSOnState ? true : false; },
    set:function(e) { return this.nativeView('setState', e === true ? $.NSOnState : $.NSOffState); }
  });

  /**
   * @member title
   * @type {string}
   * @memberof Button
   * @description Gets or sets the text label on the button.
   */
  Object.defineProperty(Button.prototype, 'title', {
    get:function() { return this.nativeView('title').toString(); },
    set:function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['title', e]);
      return this.nativeView('setTitle', $(e));
    }
  });

  /**
   * @member type
   * @type {string}
   * @memberof Button
   * @description Gets or sets the type of button, this can be 
   *              "toggle", "checkbox", "radio" or "normal".
   */
  Object.defineProperty(Button.prototype, 'type', {
    get:function() { return this.private.buttonType; },
    set:function(type) {
      this.private.buttonType = type;
      
      if (type == "toggle") this.nativeView('setButtonType',$.NSPushOnPushOffButton);
      else if (type == "checkbox") this.nativeView('setButtonType', $.NSSwitchButton);
      else if (type == "radio") this.nativeView('setButtonType', $.NSRadioButton);
      else this.nativeView('setButtonType',$.NSMomentaryLightButton);
      
      // no complement on other systems.
      //else if (type == "none") this.nativeView('setButtonType', $.NSMomentaryPushInButton);
    }
  });

  // TODO: Not supported on Win, perhaps investigate differences in behavior and replicate?
  Object.defineProperty(Button.prototype, 'style', {
    get:function() { return this.private.buttonStyle; },
    set:function(type) {
      this.private.buttonStyle = type;
      if(type == "normal") this.nativeView('setBezelStyle',$.NSTexturedRoundedBezelStyle);
      else if (type == "rounded") this.nativeView('setBezelStyle',$.NSRoundedBezelStyle);
      else if (type == "square") this.nativeView('setBezelStyle',$.NSThickSquareBezelStyle);
      else if (type == "disclosure") this.nativeView('setBezelStyle', $.NSDisclosureBezelStyle);
      else if (type == "shadowless") this.nativeView('setBezelStyle', $.NSShadowlessSquareBezelStyle);
      else if (type == "circular") this.nativeView('setBezelStyle', $.NSCircularBezelStyle);
      else if (type == "recessed") this.nativeView('setBezelStyle', $.NSRecessedBezelStyle);
      else if (type == "help") this.nativeView('setBezelStyle', $.NSHelpButtonBezelStyle);
    }
  });

  // TODO: Not supported on Win, perhaps investigate differences in behavior and replicate?
  Object.defineProperty(Button.prototype, 'showBorderOnHover', {
    get:function() { return this.nativeView('showsBorderOnlyWhileMouseInside') ? true : false; },
    set:function(e) { this.nativeView('setShowsBorderOnlyWhileMouseInside', e ? true : false ); }
  });

  /**
   * @member enabled
   * @type {string}
   * @memberof Button
   * @description Gets or sets the buttons availability and visual presentation to the user.
   *              When set to false the button is grayed out and does not respond to clicks.
   *              The default is true.
   * @default true
   */
  Object.defineProperty(Button.prototype, 'enabled', {
    get:function() { return this.nativeView('isEnabled'); },
    set:function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['enabled', e]);
      return this.nativeView('setEnabled',e); 
    }
  });

  /**
   * @member image
   * @type {string}
   * @memberof Button
   * @description Gets or sets the associated image to be displayed on the button.  This can be
   *              a named icon resource for the OS, or a URL to an image (including the app:// schema).
   */
  Object.defineProperty(Button.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['image', e]);
      this.private.img = e;
      e = utilities.makeNSImage(e);
      if(e) this.nativeView('setImage', e);
    }
  });

  return Button;

})();
