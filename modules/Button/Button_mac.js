module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

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

    // Create proxy for click event.
    this.addEventListener('mouseup', function() { this.fireEvent('click'); }.bind(this));
  }

  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  Object.defineProperty(Button.prototype, 'border', {
    get:function() { return this.native('isBordered') == $.YES ? true : false; },
    set:function(e) { return this.native('setBordered', e === true ? $.YES : $.NO); }
  });

  Object.defineProperty(Button.prototype, 'state', {
    get:function() { return this.native('state') === $.NSOnState ? true : false; },
    set:function(e) { return this.native('setState', e === true ? $.NSOnState : $.NSOffState); }
  });

  Object.defineProperty(Button.prototype, 'title', {
    get:function() { return this.native('title') },
    set:function(e) { return this.native('setTitle', $(e)); }
  });

  Object.defineProperty(Button.prototype, 'type', {
    get:function() { return this.private.buttonType; },
    set:function(type) {
      this.private.buttonType = type;
      if(type == "normal") this.native('setButtonType',$.NSMomentaryLightButton);
      else if (type == "toggle") this.native('setButtonType',$.NSPushOnPushOffButton);
      else if (type == "checkbox") this.native('setButtonType', $.NSSwitchButton);
      else if (type == "radio") this.native('setButtonType', $.NSRadioButton);
      else if (type == "none") this.native('setButtonType', $.NSMomentaryPushInButton);
    }
  });

  Object.defineProperty(Button.prototype, 'style', {
    get:function() { return this.private.buttonStyle; },
    set:function(type) {
      this.private.buttonStyle = type;
      if(type == "normal") this.native('setBezelStyle',$.NSTexturedRoundedBezelStyle);
      else if (type == "rounded") this.native('setBezelStyle',$.NSRoundedBezelStyle);
      else if (type == "square") this.native('setBezelStyle',$.NSThickSquareBezelStyle);
      else if (type == "disclosure") this.native('setBezelStyle', $.NSDisclosureBezelStyle);
      else if (type == "shadowless") this.native('setBezelStyle', $.NSShadowlessSquareBezelStyle);
      else if (type == "circular") this.native('setBezelStyle', $.NSCircularBezelStyle);
      else if (type == "recessed") this.native('setBezelStyle', $.NSRecessedBezelStyle);
      else if (type == "help") this.native('setBezelStyle', $.NSHelpButtonBezelStyle);
    }
  });

  Object.defineProperty(Button.prototype, 'showBorderOnHover', {
    get:function() { return this.native('showsBorderOnlyWhileMouseInside') ? true : false; },
    set:function(e) { this.native('setShowsBorderOnlyWhileMouseInside', e ? true : false ); }
  });

  Object.defineProperty(Button.prototype, 'enabled', {
    get:function() { return this.native('isEnabled'); },
    set:function(e) { return this.native('setEnabled',e); }
  });

  Object.defineProperty(Button.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) {
      this.private.img = e;
      e = utilities.makeNSImage(e);
      if(e) this.native('setImage', e);
    }
  });

  return Button;

})();
