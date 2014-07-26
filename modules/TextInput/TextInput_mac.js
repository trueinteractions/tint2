module.exports = (function() {
  var utilities = require('../Utilities/Utilities_mac.js');
  function Text() 
  {
    var events = {};

    function fireEvent(event, args) {
      if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    // 500 is just a guess, 22 is the standard size xib/nib files seem to output. 
  	var $text = $.NSTextField('alloc')('initWithFrame', $.NSMakeRect(0,0,200,20) );

    var NSTextFieldDelegate = $.NSObject.extend('NSTextFieldDelegate'+Math.round(Math.random()*10000));
    NSTextFieldDelegate.addMethod('init:', '@@:', function(self) { return self; });
    NSTextFieldDelegate.addMethod('controlTextDidChange:','v@:@', function(self,_cmd,frame) { fireEvent('input'); });
    NSTextFieldDelegate.addMethod('controlTextDidBeginEditing:','v@:@', function(self,_cmd,frame) { fireEvent('inputstart')});
    NSTextFieldDelegate.addMethod('controlTextDidEndEditing:','v@:@', function(self,_cmd,frame) { fireEvent('inputend')});
    NSTextFieldDelegate.register();
    var NSTextFieldDelegateInstance = NSTextFieldDelegate('alloc')('init');
    $text('setDelegate',NSTextFieldDelegateInstance);

    process.on('exit', function() {
      NSTextFieldDelegate;
      NSTextFieldDelegateInstance;
    });

    Object.defineProperty(this, 'text', {
      get:function() { return $text('stringValue')('UTF8String'); },
      set:function(e) { return $text('setStringValue',$(e)); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return $text('isEnabled'); },
      set:function(e) { return $text('setEnabled',e); }
    });

    Object.defineProperty(this, 'hidden', {
      get:function() { return $text('isHidden'); },
      set:function(e) { return $text('setHidden',e); }
    });

    Object.defineProperty(this, 'readonly', {
      get:function() { return !$text('isEditable'); },
      set:function(e) { return $text('setEditable',!e); }
    });

    Object.defineProperty(this, 'internal', {
      get:function() { return $text; }
    });

    // Apply sizing functions for NSView widgets
    utilities.attachSizeProperties($text, this, fireEvent, {width:200,height:20,maxHeight:20,maxWidth:550,minWidth:20,minHeight:20});
  }
  return Text;
})();