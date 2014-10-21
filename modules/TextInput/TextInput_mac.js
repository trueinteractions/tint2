module.exports = (function() {
  var $ = process.bridge.objc;
  var Container = require('Container');

  function TextInput(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.mouseDownBlocks = true;
    options.keyDownBlocks = true;
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['controlTextDidChange:','v@:@', function() {
          // NSTextField's do not allow overriding the keyDown component, however
          // the input event is fired directly after the event has been processed.
          this.fireEvent('keydown'); 
          this.fireEvent('input');
        }.bind(this)
      ],
      ['controlTextDidBeginEditing:','v@:@', function() { this.fireEvent('inputstart'); }.bind(this)],
      ['controlTextDidEndEditing:','v@:@', function() { this.fireEvent('inputend'); }.bind(this)]
    ]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSTextField, $.NSTextField, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');    
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setDelegate', this.nativeView);
  }

  TextInput.prototype = Object.create(Container.prototype);
  TextInput.prototype.constructor = TextInput;

  Object.defineProperty(TextInput.prototype, 'value', {
    get:function() { return this.nativeView('stringValue')('UTF8String'); },
    set:function(e) { this.nativeView('setStringValue',$(e)); }
  });

  Object.defineProperty(TextInput.prototype, 'enabled', {
    get:function() { return this.nativeView('isEnabled'); },
    set:function(e) { this.nativeView('setEnabled',e); }
  });

  Object.defineProperty(TextInput.prototype, 'textcolor', {
    get:function() { return new Color(this.nativeView('textColor')); },
    set:function(e) { this.nativeView('setTextColor',new Color(e)); }
  });

  Object.defineProperty(TextInput.prototype, 'readonly', {
    get:function() { return !this.nativeView('isEditable'); },
    set:function(e) {
      var val = e ? $.NO : $.YES;
      this.nativeView('setEditable',val);
      this.nativeView('setBezeled',val);
      this.nativeView('setDrawsBackground',val);
      this.nativeView('setSelectable',val);
    }
  });

  Object.defineProperty(TextInput.prototype, 'placeholder', {
    get:function() { return this.nativeView('cell')('placeholderString'); },
    set:function(e) { this.nativeView('cell')('setPlaceholderString', $(e.toString())); }
  });

  Object.defineProperty(TextInput.prototype, 'alignment', {
    get:function() {
      if (this.nativeView('alignment') == 0) return "left";
      else if (this.nativeView('alignment') == 1) return "right";
      else if (this.nativeView('alignment') == 2) return "center";
      else return "unknown";
    },
    set:function(e) {
      if(e == 'left') this.nativeView('setAlignment', 0);
      else if (e == 'right') this.nativeView('setAlignment', 1);
      else if (e == 'center') this.nativeView('setAlignment', 2);
    }
  });

  Object.defineProperty(TextInput.prototype, 'visible', {
    get:function() { return !this.nativeView('isHidden'); },
    set:function(e) { this.nativeView('setHidden',e ? false : true); }
  });

  Object.defineProperty(TextInput.prototype, 'linewrap', {
    get:function() { return this.nativeView('cell')('wraps'); },
    set:function(e) { this.nativeView('cell')('setWraps', e ? true : false ); }
  });

  Object.defineProperty(TextInput.prototype, 'scrollable', {
    get:function() { return this.nativeView('cell')('isScrollable'); },
    set:function(e) { this.nativeView('cell')('setScrollable', e ? true : false ); }
  });

  return TextInput;
})();
