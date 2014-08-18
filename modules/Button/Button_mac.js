module.exports = (function() {
  var utilities = require('Utilities');

  function Button() 
  {
    var $ = process.bridge.objc;
    var events = {}, img = null, text = "";

    function fireEvent(event, args) { if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(null,args); }); }
    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    // 500 is just a guess, 22 is the standard size xib/nib files seem to output. 
  	var $button = $.NSButton('alloc')('initWithFrame', $.NSMakeRect(0,0,20,20) );
    $button('setButtonType',$.NSMomentaryLightButton);
    $button('setAutoresizingMask',($.NSViewWidthSizable | $.NSViewMinYMargin));
    $button('setBezelStyle',$.NSTexturedRoundedBezelStyle);
    $button('cell')('setWraps',$.NO);

    var NSButtonDelegate = $.NSObject.extend('NSButtonDelegate'+Math.round(Math.random()*10000));
    NSButtonDelegate.addMethod('init:', '@@:', function(self) { return self; });
    NSButtonDelegate.addMethod('click:','v@:@', function(self,_cmd,frame) { fireEvent('click'); });
    NSButtonDelegate.addMethod('mouseDown:','v@:@@', function(self,_cmd,frame,o) { fireEvent('mousedown'); });
    NSButtonDelegate.addMethod('mouseUp:','v@:@', function(self,_cmd,frame) { fireEvent('mouseup'); });
    NSButtonDelegate.register();
    var NSButtonDelegateInstance = NSButtonDelegate('alloc')('init');
    
    $button('setTarget',NSButtonDelegateInstance);
    $button('setAction','click:');

    Object.defineProperty(this, 'value', {
      get:function() { return $button('title') },
      set:function(e) { return $button('setTitle', $(e)); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return $button('isEnabled'); },
      set:function(e) { return $button('setEnabled',e); }
    });

    Object.defineProperty(this, 'visible', {
      get:function() { return !$button('isHidden'); },
      set:function(e) { return $button('setHidden',!e); }
    });

    Object.defineProperty(this, 'image', {
      get:function() { return img; },
      set:function(e) { 
        img = e;
        if(e.indexOf(':') > -1) {
          //TODO: RELEASE NSImage???
          $button('setImage',$.NSImage('alloc')('initWithContentsOfURL',$NSURL('URLWithString',$(e))));
        } else if (e.indexOf('/') > -1 || e.indexOf('.') > -1) {
          $button('setImage',$.NSImage('alloc')('initWithContentsOfFile',$(e)));
        } else {
          var imageRef = utilities.getImageFromString(e);
          if(imageRef==null) {
            console.warn('Image referenced as: '+imageRef+'('+e+') could not be found.');
            img = null;
            return;
          }
          $button('setImage', $.NSImage('imageNamed',$(imageRef)));
        }
      }
    });

    Object.defineProperty(this, 'internal', {
      get:function() { return $button; }
    });

    // Apply sizing functions for NSView widgets
    utilities.attachSizeProperties($button, this, fireEvent);
  }
  return Button;
})();