module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Button(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.initViewOnly = true;

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.System.Windows.Controls.Button, $.System.Windows.Controls.Button, options);

    this.private.img = null;
    this.private.buttonType = "normal";
    this.private.buttonStyle = "normal";

    /*this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setButtonType',$.NSMomentaryLightButton);
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setBezelStyle',$.NSTexturedRoundedBezelStyle);
    this.native('cell')('setWraps',$.NO);
    this.native('setTitle', $(""));*/

  }

  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  Object.defineProperty(Button.prototype, 'border', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(Button.prototype, 'state', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(Button.prototype, 'title', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(Button.prototype, 'type', {
    get:function() { },
    set:function(type) {
      /*
      this.private.buttonType = type;
      if(type == "normal") this.nativeView('setButtonType',$.NSMomentaryLightButton);
      else if (type == "toggle") this.nativeView('setButtonType',$.NSPushOnPushOffButton);
      else if (type == "checkbox") this.nativeView('setButtonType', $.NSSwitchButton);
      else if (type == "radio") this.nativeView('setButtonType', $.NSRadioButton);
      else if (type == "none") this.nativeView('setButtonType', $.NSMomentaryPushInButton);*/
    }
  });

  Object.defineProperty(Button.prototype, 'style', {
    get:function() {  },
    set:function(type) {
      /*this.private.buttonStyle = type;
      if(type == "normal") this.nativeView('setBezelStyle',$.NSTexturedRoundedBezelStyle);
      else if (type == "rounded") this.nativeView('setBezelStyle',$.NSRoundedBezelStyle);
      else if (type == "square") this.nativeView('setBezelStyle',$.NSThickSquareBezelStyle);
      else if (type == "disclosure") this.nativeView('setBezelStyle', $.NSDisclosureBezelStyle);
      else if (type == "shadowless") this.nativeView('setBezelStyle', $.NSShadowlessSquareBezelStyle);
      else if (type == "circular") this.nativeView('setBezelStyle', $.NSCircularBezelStyle);
      else if (type == "recessed") this.nativeView('setBezelStyle', $.NSRecessedBezelStyle);
      else if (type == "help") this.nativeView('setBezelStyle', $.NSHelpButtonBezelStyle);*/
    }
  });

  Object.defineProperty(Button.prototype, 'showBorderOnHover', {
    get:function() {  },
    set:function(e) {  }
  });

  Object.defineProperty(Button.prototype, 'enabled', {
    get:function() {  },
    set:function(e) {  }
  });

  Object.defineProperty(Button.prototype, 'image', {
    get:function() {  },
    set:function(e) {  }
  });

  return Button;

})();
