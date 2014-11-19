module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');

  var Control = require('Control');

  /**
   * @class Dialog
   * @description The dialog allows you to ask a question to the user or prompt them 
   *              with a choice prior to the application continuing.
   * @extends Control
   */
  function Dialog() {
    Control.call(this, $.NSAlert, $.NSView, {});
    var img = null, buttonsSet = false, mainButton = null, auxButton = null; events = {};
    this.nativeView = this.native = $.NSAlert('alloc')('init');

   /**
    * @member title
    * @type {string}
    * @memberof Dialog
    * @description Gets or sets the caption or title of the dialog modal window.
    */
    Object.defineProperty(this, "title", {
      get:function() { return this.native('messageText'); },
      set:function(e) { this.native('setMessageText', $(e)); }
    });

   /**
    * @member message
    * @type {string}
    * @memberof Dialog
    * @description Gets or sets the text shown as a message or question to the user.
    */
    Object.defineProperty(this, "message", {
      get:function() { return this.native('informativeText'); },
      set:function(e) { this.native('setInformativeText', $(e)); }
    });

   /**
    * @member mainbutton
    * @type {string}
    * @memberof Dialog
    * @description Gets or sets the text label of the main button.
    */
    Object.defineProperty(this, "mainbutton", {
      get:function() { return mainButton; },
      set:function(e) { mainButton = e; }
    });

   /**
    * @member auxbutton
    * @type {string}
    * @memberof Dialog
    * @description Gets or sets the text label of the auxillary button.
    */
    Object.defineProperty(this, "auxbutton", {
      get:function() { return auxButton; },
      set:function(e) { auxButton = e; }
    });

   /**
    * @member suppression
    * @type {string}
    * @memberof Dialog
    * @description Gets or sets the text label of the suppress option.
    *              This is useful if you'd like to add an option on the dialog to
    *              not show this dialog again.  Setting this to anything other than
    *              null uses the value as the title and makes the check box visible.
    */
    Object.defineProperty(this, "suppression", {
      get:function() {
        if(!this.native('showsSuppressionButton')) return null;
        return this.native('suppressionButton')('title');
      },
      set:function(e) {
        this.native('setShowsSuppressionButton', e == null ? $.NO : $.YES);
        if(e !== null) this.native('suppressionButton')('setTitle', $(e)); 
      }
    });

   /**
    * @member suppression
    * @type {string}
    * @memberof Dialog
    * @description Gets or sets the text label of the suppress option.
    *              This is useful if you'd like to add an option on the dialog to
    *              not show this dialog again.  Setting this to anything other than
    *              null uses the value as the title and makes the check box visible.
    */
    Object.defineProperty(this, "suppressionChecked", {
      get:function() {
        if(!this.native('showsSuppressionButton')) return false;
        return this.native('suppressionButton')('state') === $.NSOnState ? true : false;
      },
      set:function(e) {
        if(!this.native('showsSuppressionButton')) return false;
        this.native('suppressionButton')('setState', e === true ? $.NSOnState : $.NSOffState); 
      }
    });

    Object.defineProperty(this, 'icon', {
      get:function() { return img; },
      set:function(e) { 
        img = e;
        e = utilities.makeNSImage(e);
        if(e) this.native('setIcon', e);
      }
    });

    Object.defineProperty(this, "type", {
      get:function() { 
        if(this.native('alertStyle') == $.NSWarningAlertStyle) return "warning";
        else if (this.native('alertStyle') == $.NSInformationalAlertStyle) return "information";
        else if (this.native('alertStyle') == $.NSCriticalAlertStyle) return "critical";
      },
      set:function(e) {
        if(e == "warning") this.native('setAlertStyle', $.NSWarningAlertStyle);
        else if (e == "critical") this.native('setAlertStyle', $.NSCriticalAlertStyle);
        else this.native('setAlertStyle', $.NSInformationalAlertStyle); 
      }
    });

    //TODO: Doesn't work on MacOSX, unsure why.
    //this.setChild = function(e) { this.native('setAccessoryView',e.nativeView); }

    this.open = function(z) {
      if(!buttonsSet) {
        if(mainButton == null && auxButton !== null)
          throw new Error("The main button was not defined, however the auxillary button was.  A main button must be set for auxilliary buttons to exist.");

        if(mainButton !== null) this.native('addButtonWithTitle', $(mainButton));
        if(auxButton !== null) this.native('addButtonWithTitle', $(auxButton));
        buttonsSet = true;
      }

      var w = z ? z : $.NSApplication('sharedApplication')('mainWindow');
      if(w) {
        w = w.native ? w.native : w;
        var comp = $(function(self,e) {
          try {
            if(e == $.NSAlertFirstButtonReturn) this.fireEvent('click',['main']);
            else this.fireEvent('click',['aux']);
          } catch(e) {
            console.error(e.message);
            console.error(e.stack);
            process.exit(1);
          }
        }.bind(this),[$.void,['?',$.long]]);
        this.native('beginSheetModalForWindow',w,'completionHandler',comp);
      } else {
        var e = this.native('runModal');
        if(e == $.NSAlertFirstButtonReturn) this.fireEvent('click',['main']);
        else this.fireEvent('click',['aux']);
      }
    }.bind(this);
  }
  Dialog.prototype = Object.create(Control.prototype);
  Dialog.prototype.constructor = Dialog;


  return Dialog;
})();