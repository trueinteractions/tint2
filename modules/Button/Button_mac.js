module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  function Button(options) {
    var img = null, buttonType = "normal", buttonStyle = "normal";;
    Container.call(this, $.NSButton, $.NSButton, {mouseDownBlocks:true,keyDownBlocks:true});
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

    Object.defineProperty(this, 'style', {
      get:function() { return buttonStyle; },
      set:function(type) {
        buttonStyle = type;
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

    // Create proxy for click event.
    this.addEventListener('mouseup', function() { this.fireEvent('click'); }.bind(this));

    if(options) {
      Object.keys(options).forEach(function(key) { this[key] = options[key]; }.bind(this));
    }
  }
  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  return Button;
})();