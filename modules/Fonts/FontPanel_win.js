module.exports = (function() {
  var Panel = require('Panel');
  var Font = require('Font');
  var $ = process.bridge.dotnet;
  var util = require('Utilities');

  function FontPanel(NativeObjectClass, NativeViewClass, properties, options, inherited) {
    options = options || {};

    this.private = {visible:false,events:{}};
    this.native = new $.System.Windows.Forms.FontDialog();
    this.private.multiple = false;
    this.native.ShowColor = true;
    this.native.ShowEffects = true;

    util.setProperties(this, properties, inherited);
  }

  FontPanel.prototype = Object.create(Panel.prototype);
  FontPanel.prototype.constructor = FontPanel;

  //TODO: Only supported on OSX.
  //FontPanel.prototype.setChild = function(e) { }

  FontPanel.prototype.scanForNewFonts = function() { }

  Object.defineProperty(FontPanel.prototype, 'selected', {
    get:function() { return this.private.selected; },
    set:function(fontObj) { this.private.selected = fontObj; }
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
        var s = this.native.Font;
        this.native.ShowDialogAsync();
        //TODO: Create a real font dialog.
        var interval = setInterval(function() {
          var c = this.native.Font;
          if(c.Bold !== s.Bold || 
              s.Name !== c.Name ||
              c.Size !== s.Size ||
              c.Italic !== s.Italic || 
              c.Strikeout !== s.Strikeout ||
              c.Height !== s.Height || 
              c.Underline !== s.Underline)
          {

            var f = new Font(c.Name,c.Size);
            f.bold = c.Bold;
            f.italic = c.Italic;
            f.size = c.Size;

            this.private.selected = f;
            this.fireEvent('fontchange');
            this.fireEvent('closed');
            this.private.visible = false;
            this.native.Dispose();

            this.native = new $.System.Windows.Forms.FontDialog();
            this.native.ShowColor = true;
            this.native.ShowEffects = true;
            clearInterval(interval);
          }
        }.bind(this),250);
      } else {
        this.native.Dispose();
        this.native = new $.System.Windows.Forms.FontDialog();
        this.native.ShowColor = true;
        this.native.ShowEffects = true;
      }
    }
  });


  return FontPanel;
})();
