module.exports = (function() {
  var Panel = require('Panel');
  var utilities = require('Utilities');
  var Font = require('Font');
  var $ = process.bridge.dotnet;

  function FontPanel(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    this.private = {visible:false,events:{}};
    this.native = new $.System.Windows.Forms.FontDialog();
    this.private.multiple = false;
    this.native.ShowColor = true;
    this.native.ShowEffects = true;

  }

  FontPanel.prototype = Object.create(Panel.prototype);
  FontPanel.prototype.constructor = FontPanel;

  //TODO: Only supported on OSX.
  //FontPanel.prototype.setChild = function(e) { }

  FontPanel.prototype.scanForNewFonts = function() { }

  Object.defineProperty(FontPanel.prototype, 'selected', {
    get:function() { },
    set:function(fontObj) { }
  });

  Object.defineProperty(FontPanel.prototype, 'multiple', {
    get:function() { return this.native.multiple; },
    set:function(e) { this.native.multiple = e ? true : false; }
  });

  Object.defineProperty(FontPanel.prototype, 'visible', {
    get:function() { return this.private.visible; },
    set:function(e) {
      e = e ? true : false;
      this.private.visible = e;
      if(e) { 
        //var selectedFont = this.native.Color;
        this.native.ShowDialogAsync();
        //TODO: Create a real color component so we don't have to poll
        // on this.
        var interval = setInterval(function() {
          //var c = this.native.Color;
          //if(c.R.ToString() != selectedColor.R.ToString() || 
          //    c.G.ToString() != selectedColor.G.ToString() || 
          //    c.B.ToString() != selectedColor.B.ToString() || 
          //    (this.showAlpha && c.A.ToString() != selectedColor.A.ToString()))
          //{
          //  this.fireEvent('colorchange');
          //  this.fireEvent('closed');
          //  this.private.visible = false;
          //  this.native.Dispose();

          //  this.native = new $.System.Windows.Forms.ColorDialog();
          //  this.native.FullOpen = true;
          //  this.native.SolidColorOnly = false;
          //  clearInterval(interval);
          //}
        }.bind(this),250);
      } else {
        this.native.Dispose();
        this.native = new $.System.Windows.Forms.ColorDialog();
        this.native.FullOpen = true;
        this.native.SolidColorOnly = false;
      }
    }
  });


  return FontPanel;
})();
