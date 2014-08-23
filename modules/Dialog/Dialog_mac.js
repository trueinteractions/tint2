module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');

  function Dialog() {
    var $dialog = $.NSAlert('alloc')('init');
    var img = null, buttonsSet = false, mainButton = null, auxButton = null; events = {};

    //TODO: Inherit event listeners..?
    function fireEvent(event, args) {
      if(events[event]) 
        (events[event]).forEach(function(item,index,arr) { 
          if(Array.isArray(args))
            item.apply(null,args);
          else
            item.apply(null,[args]);
        });
    }
    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    Object.defineProperty(this, "title", {
      get:function() { return $dialog('messageText'); },
      set:function(e) { $dialog('setMessageText', $(e)); }
    });

    Object.defineProperty(this, "message", {
      get:function() { return $dialog('informativeText'); },
      set:function(e) { $dialog('setInformativeText', $(e)); }
    });

    Object.defineProperty(this, "mainbutton", {
      get:function() { return mainButton; },
      set:function(e) { mainButton = e; }
    });

    Object.defineProperty(this, "auxbutton", {
      get:function() { return auxButton; },
      set:function(e) { auxButton = e; }
    });

    Object.defineProperty(this, "suppression", {
      get:function() {
        if(!$dialog('showsSuppressionButton')) return null;
        return $dialog('suppressionButton')('title');
      },
      set:function(e) {
        $dialog('setShowsSuppressionButton', e == null ? $.NO : $.YES);
        if(e !== null) $dialog('suppressionButton')('setTitle', $(e)); 
      }
    });

    Object.defineProperty(this, "suppressionChecked", {
      get:function() {
        if(!$dialog('showsSuppressionButton')) return false;
        return $dialog('suppressionButton')('state') === $.NSOnState ? true : false;
      },
      set:function(e) {
        if(!$dialog('showsSuppressionButton')) return false;
        $dialog('suppressionButton')('setState', e === true ? $.NSOnState : $.NSOffState); 
      }
    });

    Object.defineProperty(this, 'native', {
      get:function() { return $dialog; }
    });

    Object.defineProperty(this, 'nativeView', {
      get:function() { return $dialog; }
    })

    Object.defineProperty(this, 'icon', {
      get:function() { return img; },
      set:function(e) { 
        img = e; // TODO: Release NSImage.
        if(e.indexOf(':') > -1)
          this.native('setIcon',$.NSImage('alloc')('initWithContentsOfURL',$NSURL('URLWithString',$(e))));
        else if (e.indexOf('/') > -1 || e.indexOf('.') > -1)
          this.native('setIcon',$.NSImage('alloc')('initWithContentsOfFile',$(e)));
        else {
          var imageRef = utilities.getImageFromString(e);
          if(imageRef==null) img = null;
          else this.native('setIcon', $.NSImage('imageNamed',$(imageRef)));
        }
      }
    });

    Object.defineProperty(this, "type", {
      get:function() { 
        if($dialog('alertStyle') == $.NSWarningAlertStyle) return "warning";
        else if ($dialog('alertStyle') == $.NSInformationalAlertStyle) return "information";
        else if ($dialog('alertStyle') == $.NSCriticalAlertStyle) return "critical";
      },
      set:function(e) {
        if(e == "warning") $dialog('setAlertStyle', $.NSWarningAlertStyle);
        else if (e == "critical") $dialog('setAlertStyle', $.NSCriticalAlertStyle);
        else $dialog('setAlertStyle', $.NSInformationalAlertStyle); 
      }
    });

    this.setChild = function(e) { $dialog('setAccessoryView',e); }

    this.open = function(z) {
      if(!buttonsSet) {
        if(mainButton == null && auxButton !== null)
          throw new Error("The main button was not defined, however the auxillary button was.  A main button must be set for auxilliary buttons to exist.");

        if(mainButton !== null) $dialog('addButtonWithTitle', $(mainButton));
        if(auxButton !== null) $dialog('addButtonWithTitle', $(auxButton));
        buttonsSet = true;
      }

      var w = z ? z : $.NSApplication('sharedApplication')('mainWindow');
      if(w) {
        w = w.native ? w.native : w;
        var comp = $(function(self,e) {
          try {
            if(e == $.NSAlertFirstButtonReturn) fireEvent('click','main');
            else fireEvent('click','aux');
          } catch(e) {
            console.error(e.message);
            console.error(e.stack);
            process.exit(1);
          }
        },[$.void,['?',$.long]]);
        $dialog('beginSheetModalForWindow',w,'completionHandler',comp);
      } else {
        var e = $dialog('runModal');
        if(e == $.NSAlertFirstButtonReturn) fireEvent('click','main');
        else fireEvent('click','aux');
      }
    }
  }
  return Dialog;
})();