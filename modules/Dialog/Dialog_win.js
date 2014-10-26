module.exports = (function() {
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');

  var Control = require('Control');

  function Dialog() {
    var img = null, 
      buttonsSet = false, 
      mainButton = null, 
      auxButton = null,
      events = {},
      title = "",
      message = "";
    
    Object.defineProperty(this, "title", {
      get:function() { return title; },
      set:function(e) { title = e }
    });

    Object.defineProperty(this, "message", {
      get:function() { return message },
      set:function(e) { message = e; }
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
        //if(!this.native('showsSuppressionButton')) return null;
        //return this.native('suppressionButton')('title');
      },
      set:function(e) {
        //this.native('setShowsSuppressionButton', e == null ? $.NO : $.YES);
        //if(e !== null) this.native('suppressionButton')('setTitle', $(e)); 
      }
    });

    Object.defineProperty(this, "suppressionChecked", {
      get:function() {
        //if(!this.native('showsSuppressionButton')) return false;
        //return this.native('suppressionButton')('state') === $.NSOnState ? true : false;
      },
      set:function(e) {
        //if(!this.native('showsSuppressionButton')) return false;
        //this.native('suppressionButton')('setState', e === true ? $.NSOnState : $.NSOffState); 
      }
    });

    Object.defineProperty(this, 'icon', {
      get:function() { return img; },
      set:function(e) { 
        img = e;
        e = utilities.makeImage(e);
//        if(e) this.native('setIcon', e);
      }
    });

    Object.defineProperty(this, "type", {
      get:function() { 
        //if(this.native('alertStyle') == $.NSWarningAlertStyle) return "warning";
        //else if (this.native('alertStyle') == $.NSInformationalAlertStyle) return "information";
        //else if (this.native('alertStyle') == $.NSCriticalAlertStyle) return "critical";
      },
      set:function(e) {
        //if(e == "warning") this.native('setAlertStyle', $.NSWarningAlertStyle);
        //else if (e == "critical") this.native('setAlertStyle', $.NSCriticalAlertStyle);
        //else this.native('setAlertStyle', $.NSInformationalAlertStyle); 
      }
    });

    this.setChild = function(e) {  }

    this.open = function(z) {

    }.bind(this);
  }
  Dialog.prototype = Object.create(Control.prototype);
  Dialog.prototype.constructor = Dialog;


  return Dialog;
})();