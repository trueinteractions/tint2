module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  function Button(options) {
    var img = null, buttonType = "normal";
    Container.call(this, $.NSButton, $.NSButton, {});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setButtonType',$.NSMomentaryLightButton);
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setBezelStyle',$.NSTexturedRoundedBezelStyle);
    this.native('cell')('setWraps',$.NO);

    Object.defineProperty(this, 'state', {
      get:function() { return this.native('state') === $.NSOnState ? true : false; },
      set:function(e) { return this.native('setState', e === true ? $.NSOnState : $.NSOffState); }
    });

    Object.defineProperty(this, 'title', {
      get:function() { return this.native('title') },
      set:function(e) { return this.native('setTitle', $(e)); }
    });

    Object.defineProperty(this, 'type', {
      get:function() { return buttonType; },
      set:function(type) {
        buttonType = type;
        if(type == "normal") this.native('setButtonType',$.NSMomentaryLightButton);
        else if (type == "toggle") this.native('setButtonType',$.NSPushOnPushOffButton);
        else if (type == "checkbox") this.native('setButtonType', $.NSSwitchButton);
        else if (type == "radio") this.native('setButtonType', $.NSRadioButton);
      }
    });

    Object.defineProperty(this, 'showBorderOnHover', {
      get:function() { return this.native('showsBorderOnlyWhileMouseInside') ? true : false; },
      set:function(e) { this.native('setShowsBorderOnlyWhileMouseInside', e ? true : false ); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return this.native('isEnabled'); },
      set:function(e) { return this.native('setEnabled',e); }
    });

    Object.defineProperty(this, 'image', {
      get:function() { return img; },
      set:function(e) { 
        img = e; // TODO: Release NSImage.
        if(e.indexOf(':') > -1)
          this.native('setImage',$.NSImage('alloc')('initWithContentsOfURL',$NSURL('URLWithString',$(e))));
        else if (e.indexOf('/') > -1 || e.indexOf('.') > -1)
          this.native('setImage',$.NSImage('alloc')('initWithContentsOfFile',$(e)));
        else {
          var imageRef = utilities.getImageFromString(e);
          if(imageRef==null) img = null;
          else this.native('setImage', $.NSImage('imageNamed',$(imageRef)));
        }
      }
    });

    if(options) {
      Object.keys(options).forEach(function(key) { this[key] = options[key]; }.bind(this));
    }
  }
  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  return Button;
})();