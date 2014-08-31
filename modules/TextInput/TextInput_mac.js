module.exports = (function() {
  var $ = process.bridge.objc;
  var Container = require('Container');

  function TextInput() 
  {
    Container.call(this, $.NSTextField, $.NSTextField, {mouseDownBlocks:true,keyDownBlocks:true});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');    
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);

    var NSTextFieldDelegate = $.NSObject.extend('NSTextFieldDelegate'+Math.round(Math.random()*10000));
    NSTextFieldDelegate.addMethod('init:', '@@:', function(self) { return self; });
    NSTextFieldDelegate.addMethod('controlTextDidChange:','v@:@', function(self,_cmd,frame) { 
      try {
        this.fireEvent('keydown'); // NSTextField's do not allow overriding the keyDown component, however
                                   // the input event is fired directly after the event has been processed.
        this.fireEvent('input');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    NSTextFieldDelegate.addMethod('controlTextDidBeginEditing:','v@:@', function(self,_cmd,frame) { 
      try {
        this.fireEvent('inputstart');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    NSTextFieldDelegate.addMethod('controlTextDidEndEditing:','v@:@', function(self,_cmd,frame) { 
      try {
        this.fireEvent('inputend');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    NSTextFieldDelegate.register();
    var NSTextFieldDelegateInstance = NSTextFieldDelegate('alloc')('init');
    this.nativeView('setDelegate',NSTextFieldDelegateInstance);

    Object.defineProperty(this, 'value', {
      get:function() { return this.nativeView('stringValue')('UTF8String'); },
      set:function(e) { this.nativeView('setStringValue',$(e)); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return this.nativeView('isEnabled'); },
      set:function(e) { this.nativeView('setEnabled',e); }
    });


    Object.defineProperty(this, 'textcolor', {
      get:function() { return new Color(this.nativeView('textColor')); },
      set:function(e) { this.nativeView('setTextColor',e.native); }
    });

    Object.defineProperty(this, 'alignment', {
      get:function() {
        if (this.nativeView('alignment') == 0) return "left";
        else if (this.nativeView('alignment') == 1) return "right";
        else if (this.nativeView('alignment') == 2) return "center";
        //else if (this.nativeView('alignment') == 3) return "justified";
        //else if (this.nativeView('alignment') == 4) return "natural";
        else return "unknown";
      },
      set:function(e) {
        if(e == 'left') this.nativeView('setAlignment', 0);
        else if (e == 'right') this.nativeView('setAlignment', 1);
        else if (e == 'center') this.nativeView('setAlignment', 2);
        //else if (e == 'justified') $text('setAlignment', 3);
        //else if (e == 'natural') $text('setAlignment', 4);
      }
    });

    Object.defineProperty(this, 'visible', {
      get:function() { return !this.nativeView('isHidden'); },
      set:function(e) { this.nativeView('setHidden',e ? false : true); }
    });

    Object.defineProperty(this, 'readonly', {
      get:function() { return !this.nativeView('isEditable'); },
      set:function(e) {
        var val = e ? $.NO : $.YES;
        this.nativeView('setEditable',val);
        this.nativeView('setBezeled',val);
        this.nativeView('setDrawsBackground',val);
        this.nativeView('setSelectable',val);
      }
    });

    Object.defineProperty(this, 'linewrap', {
      get:function() { return this.nativeView('cell')('wraps'); },
      set:function(e) { this.nativeView('cell')('setWraps', e ? true : false ); }
    });

    Object.defineProperty(this, 'scrollable', {
      get:function() { return this.nativeView('cell')('isScrollable'); },
      set:function(e) { this.nativeView('cell')('setScrollable', e ? true : false ); }
    });
  }

  TextInput.prototype = Object.create(Container.prototype);
  TextInput.prototype.constructor = TextInput;
  return TextInput;
})();