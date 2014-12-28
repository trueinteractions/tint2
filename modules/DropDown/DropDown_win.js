module.exports = (function() {
  if(global.__TINT.DropDown) {
    return global.__TINT.DropDown;
  }

  var TextInput = require('TextInput');
  var $ = process.bridge.dotnet;

  function DropDown(options) {
    options = options || {};

    this.nativeClass = this.nativeClass || $.System.Windows.Controls.ComboBox;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.ComboBox;
    TextInput.call(this, options);

    this.native.addEventListener('PreviewMouseDown', function() {
      if(this.private.contextMenu) {
        this.private.contextMenu.IsOpen = !this.private.contextMenu.IsOpen;
      }
    }.bind(this));
    this.private.menu = null;
    this.private.contextMenu = null;
    this.private.selectedIndex = null;
  }

  DropDown.prototype = Object.create(TextInput.prototype);
  DropDown.prototype.constructor = DropDown;

  Object.defineProperty(DropDown.prototype, 'pullsdown', {
    get:function() {
      if(this.private.contextMenu)
        return this.native.ContextMenu.Placement != $.System.Windows.Controls.Primitives.PlacementMode.Center;
      else
        return false;
    },
    set:function(e) { 
      if(e) this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Bottom;
      else this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Center;
    }
  })

  Object.defineProperty(DropDown.prototype, 'options', {
    get:function() { return this.private.menu; },
    set:function(e) {
      this.private.menu = e;
      // convert menu to context menu.
      this.private.contextMenu = new $.System.Windows.Controls.ContextMenu();

      this.private.menu.parent = this.private.contextMenu;
      for(var i=0; i < e.children.length ; i++)
        this.private.contextMenu.Items.Add(e.children[i].native);

      this.native.ContextMenu = this.private.contextMenu;
      this.native.ContextMenu.PlacementTarget = this.native;
      this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Center;
      setTimeout(function() {
        this.native.ContextMenu.MinWidth = this.native.ActualWidth;
        this.native.addEventListener('SizeChanged', function() {
          this.native.ContextMenu.MinWidth = this.native.ActualWidth;
        }.bind(this));
      }.bind(this),0);
    }
  });

  Object.defineProperty(DropDown.prototype, 'value', {
    get:function() { return this.native.SelectionBoxItem.toStirng(); },
    set:function(e) { this.native.SelectionBoxItem = e.toString(); }
  });

  global.__TINT.DropDown = DropDown;
  return DropDown;
})();