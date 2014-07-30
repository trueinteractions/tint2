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
    //NSTextFieldDelegate.addMethod('mouseDown:','v@:@', function(self, _cmd, control) { console.log('mouse down.'); });
    NSTextFieldDelegate.addMethod('controlTextDidChange:','v@:@', function(self,_cmd,frame) { fireEvent('input'); });
    NSTextFieldDelegate.addMethod('controlTextDidBeginEditing:','v@:@', function(self,_cmd,frame) { fireEvent('inputstart')});
    NSTextFieldDelegate.addMethod('controlTextDidEndEditing:','v@:@', function(self,_cmd,frame) { fireEvent('inputend')});
    NSTextFieldDelegate.register();
    var NSTextFieldDelegateInstance = NSTextFieldDelegate('alloc')('init');
    $text('setDelegate',NSTextFieldDelegateInstance);
    //$text('setTarget',NSTextFieldDelegateInstance);
    //$text('setAction','mouseDown:');
    //$text('sendActionOn',$.NSLeftMouseDownMask);

    process.on('exit', function() {
      NSTextFieldDelegate;
      NSTextFieldDelegateInstance;
    });

    Object.defineProperty(this, 'text', {
      get:function() { return $text('stringValue')('UTF8String'); },
      set:function(e) { $text('setStringValue',$(e)); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return $text('isEnabled'); },
      set:function(e) { $text('setEnabled',e); }
    });

    Object.defineProperty(this, 'alignment', {
      get:function() {
        if ($text('alignment') == 0) return "left";
        else if ($text('alignment') == 1) return "right";
        else if ($text('alignment') == 2) return "center";
        //else if ($text('alignment') == 3) return "justified";
        //else if ($text('alignment') == 4) return "natural";
        else return "unknown";
      },
      set:function(e) {
        if(e == 'left') $text('setAlignment', 0);
        else if (e == 'right') $text('setAlignment', 1);
        else if (e == 'center') $text('setAlignment', 2);
        //else if (e == 'justified') $text('setAlignment', 3);
        //else if (e == 'natural') $text('setAlignment', 4);
      }
    });

    Object.defineProperty(this, 'hidden', {
      get:function() { return $text('isHidden'); },
      set:function(e) { $text('setHidden',e); }
    });

    Object.defineProperty(this, 'readonly', {
      get:function() { return !$text('isEditable'); },
      set:function(e) { $text('setEditable',!e); }
    });

    Object.defineProperty(this, 'linewrap', {
      get:function() { return $text('cell')('wraps'); },
      set:function(e) { $text('cell')('setWraps', e ? true : false ); }
    });

    Object.defineProperty(this, 'scrollable', {
      get:function() { return $text('cell')('isScrollable'); },
      set:function(e) { $text('cell')('setScrollable', e ? true : false ); }
    });


    Object.defineProperty(this, 'internal', {
      get:function() { return $text; }
    });

    // Apply sizing functions for NSView widgets
    utilities.attachSizeProperties($text, this, fireEvent, {width:200,height:20,maxHeight:20,maxWidth:550,minWidth:20,minHeight:20});
  }
  return Text;
})();