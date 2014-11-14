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
    this.native('setTitle', $(""));
  }

  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  Object.defineProperty(Button.prototype, 'border', {
    get:function() { return this.nativeView('isBordered') == $.YES ? true : false; },
    set:function(e) { return this.nativeView('setBordered', e === true ? $.YES : $.NO); }
  });

  Object.defineProperty(Button.prototype, 'state', {
    get:function() { return this.nativeView('state') === $.NSOnState ? true : false; },
    set:function(e) { return this.nativeView('setState', e === true ? $.NSOnState : $.NSOffState); }
  });

  Object.defineProperty(Button.prototype, 'title', {
    get:function() { return this.nativeView('title').toString(); },
    set:function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['title', e]);
      return this.nativeView('setTitle', $(e));
    }
  });

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

  Object.defineProperty(Button.prototype, 'showBorderOnHover', {
    get:function() { return this.nativeView('showsBorderOnlyWhileMouseInside') ? true : false; },
    set:function(e) { this.nativeView('setShowsBorderOnlyWhileMouseInside', e ? true : false ); }
  });

  Object.defineProperty(Button.prototype, 'enabled', {
    get:function() { return this.nativeView('isEnabled'); },
    set:function(e) {
      // Private event, do not rely on it.
      this.fireEvent('property-change', ['enabled', e]);
      return this.nativeView('setEnabled',e); 
    }
  });

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
