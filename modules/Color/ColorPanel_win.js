module.exports = (function() {
  var Panel = require('Panel');
  var Color = require('Color');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;

  function ColorPanel(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

  //TODO: Color change event!
  //  options.delegates = options.delegates || [];
  //  options.delegates = options.delegates.concat([['changeColor:', 'v@:@', function(self, cmd, notif) { this.fireEvent('colorchange'); }.bind(this)]]);

   // if(NativeObjectClass)
   //   Panel.call(this, NativeObjectClass, NativeViewClass, options);
   // else {
   //   options.initViewOnly = true;
   //   Panel.call(this, $.System.Windows.Forms.ColorDialog, $.System.Windows.Forms.ColorDialog, options);
   // }
    this.private = {visible:false,events:{}};
    this.nativeView = this.native = new $.System.Windows.Forms.ColorDialog();
    this.native.FullOpen = true;
    this.native.SolidColorOnly = false;
  }

  ColorPanel.prototype = Object.create(Panel.prototype);
  ColorPanel.prototype.constructor = ColorPanel;
  
  util.defEvents(ColorPanel.prototype);
  //TODO: This is not supported on Windows, but is on OSX, add to win?.
  //ColorPanel.prototype.setChild = function(e) { this.native('setAccessoryView',e.nativeView); }
  //ColorPanel.prototype.appendChild = ColorPanel.prototype.removeChild = null;

  util.makePropertyBoolType(ColorPanel.prototype, 'showAlpha', 'SolidColorOnly', false, true);

  Object.defineProperty(ColorPanel.prototype, 'selected', {
    get:function() { 
      var c = this.native.Color;
      var n = new Color('rgba',
        parseInt(c.R.ToString()),
        parseInt(c.G.ToString()),
        parseInt(c.B.ToString()),
        parseInt(c.A.ToString())/255);
      return n; 
    },
    set:function(colorObj) {
      var c = $.System.Drawing.Color.FromArgb(colorObj.alpha,colorObj.red,colorObj.green,colorObj.blue);
      this.native.Color = c;
    }
  });

  Object.defineProperty(ColorPanel.prototype, 'visible', {
    get:function() { return this.private.visible; },
    set:function(e) {
      e = e ? true : false;
      this.private.visible = e;
      if(e) { 
        var selectedColor = this.native.Color;
        this.native.ShowDialogAsync();
        //TODO: Create a real color component so we don't have to poll
        // on this.
        var interval = setInterval(function() {
          var c = this.native.Color;
          if(c.R.ToString() !== selectedColor.R.ToString() || 
              c.G.ToString() !== selectedColor.G.ToString() || 
              c.B.ToString() !== selectedColor.B.ToString() || 
              (this.showAlpha && c.A.ToString() !== selectedColor.A.ToString()))
          {
            this.fireEvent('colorchange');
            this.fireEvent('closed');
            this.private.visible = false;
            this.native.Dispose();

            this.native = new $.System.Windows.Forms.ColorDialog();
            this.native.FullOpen = true;
            this.native.SolidColorOnly = false;
            clearInterval(interval);
          }
        }.bind(this),250);
      } else {
        this.native.Dispose();
        this.native = new $.System.Windows.Forms.ColorDialog();
        this.native.FullOpen = true;
        this.native.SolidColorOnly = false;
      }
    }
  });

  return ColorPanel;
})();
