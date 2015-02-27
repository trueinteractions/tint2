module.exports = (function() {
  if(global.__TINT.DropDown) {
    return global.__TINT.DropDown;
  }

  var TextInput = require('TextInput');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;

  function DropDown(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.ComboBox;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.ComboBox;
    TextInput.call(this, options);
    this.private.previewMouseDownHandler = function() {
      if(this.private.contextMenu) {
        this.private.contextMenu.IsOpen = !this.private.contextMenu.IsOpen;
      }
    }.bind(this);
    this.native.addEventListener('PreviewMouseDown', this.private.previewMouseDownHandler);
    this.private.menu = null;
    this.private.contextMenu = new $.System.Windows.Controls.ContextMenu();
    this.private.selectedIndex = null;

    util.makePropertyBoolTypeOnTarget(DropDown.prototype, 'pullsdown', 
      this.private.contextMenu,
      'Placement',
      $.System.Windows.Controls.Primitives.PlacementMode.Bottom,
      $.System.Windows.Controls.Primitives.PlacementMode.Center);
  }

  DropDown.prototype = Object.create(TextInput.prototype);
  DropDown.prototype.constructor = DropDown;

  Object.defineProperty(DropDown.prototype, 'options', {
    get:function() { return this.private.menu; },
    set:function(e) {
      this.private.menu = e;
      // convert menu to context menu.
      this.private.menu.parent = this.private.contextMenu;
      this.private.contextMenu.Items.Clear();
      for(var i=0; i < e.children.length ; i++) {
        this.private.contextMenu.Items.Add(e.children[i].native);
      }
      this.native.ContextMenu = this.private.contextMenu;
      this.native.ContextMenu.PlacementTarget = this.native;
      this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Center;
      setTimeout(function() {
        this.native.ContextMenu.MinWidth = this.native.ActualWidth;
        this.private.sizeChangedHandler = function() {
          this.native.ContextMenu.MinWidth = this.native.ActualWidth;
        }.bind(this);
        this.native.addEventListener('SizeChanged', this.private.sizeChangedHandler);
      }.bind(this),0);
    }
  });

  util.makePropertyStringType(DropDown.prototype, 'value', 'SelectionBoxItem');

  global.__TINT.DropDown = DropDown;
  return DropDown;
})();