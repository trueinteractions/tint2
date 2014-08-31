module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');

  if(!$.TintTextInputDelegate) {
    var TintTextInputDelegate = $.NSObject.extend('TintTextInputDelegate');
    TintTextInputDelegate.addMethod('initWithJavascriptObject:', ['@',[TintTextInputDelegate,$.selector,'@']], 
      utilities.errorwrap(function(self, cmd, id) {
        self.callback = application.private.delegateMap[id.toString()];
        application.private.delegateMap[id.toString()] = null;
        return self;
    }));
    TintTextInputDelegate.addMethod('controlTextDidChange:','v@:@',
      utilities.errorwrap(function(self,_cmd,frame) { 
        self.callback.fireEvent('keydown'); // NSTextField's do not allow overriding the keyDown component, however
                                   // the input event is fired directly after the event has been processed.
        self.callback.fireEvent('input');
    }));
    TintTextInputDelegate.addMethod('controlTextDidBeginEditing:','v@:@',
      utilities.errorwrap(function(self,_cmd,frame) { 
        self.callback.fireEvent('inputstart');
    }));
    TintTextInputDelegate.addMethod('controlTextDidEndEditing:','v@:@',
      utilities.errorwrap(function(self,_cmd,frame) { 
        self.callback.fireEvent('inputend');
    }));
    TintTextInputDelegate.register();
  }

  function TextInput() 
  {
    Container.call(this, $.NSTextField, $.NSTextField, {mouseDownBlocks:true,keyDownBlocks:true});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');    
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);

    var id = (Math.random()*100000).toString();
    application.private.delegateMap[id] = this;
    var textInputDelegate = TintTextInputDelegate('alloc')('initWithJavascriptObject', $(id));
    this.nativeView('setDelegate',textInputDelegate);
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
    set:function(e) { this.nativeView('setTextColor',e.native); }
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