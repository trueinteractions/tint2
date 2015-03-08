module.exports = (function() {
  if(global.__TINT.Toolbar) {
    return global.__TINT.Toolbar;
  }
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function resetChildNodes(toolbar) {
    for(var i=0; i < toolbar.private.children.length; i++) {
      var child = toolbar.private.children[i];
      if(child.private && child.private.type === "ToolbarItem") {
        if(toolbar.state === "icon") {
          child.private.image.Height = toolbar.nativeView.Height - 12;
          child.private.image.Width = toolbar.nativeView.Height - 12;
          child.private.image.Visibility = $.System.Windows.Visibility.Visible;
          child.private.label.Visibility = $.System.Windows.Visibility.Collapsed;
        } else if (toolbar.state === "iconandlabel") {
          child.private.image.Height = toolbar.nativeView.Height - 24;
          child.private.image.Width = toolbar.nativeView.Height - 24;
          child.private.image.Visibility = $.System.Windows.Visibility.Visible;
          child.private.label.Visibility = $.System.Windows.Visibility.Visible;
        } else if (toolbar.state === "label") {
          child.private.image.Visibility = $.System.Windows.Visibility.Collapsed;
          child.private.label.Visibility = $.System.Windows.Visibility.Visible;
        }
      }
    }
  }

  function Toolbar(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.ToolBar;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.ToolBar;
    Container.call(this, options);
    this.nativeView.InternalChildren = this.nativeView.Items;
    this.nativeView.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Stretch;
    this.nativeView.HorizontalContentAlignment = $.System.Windows.HorizontalAlignment.Stretch;
    this.nativeView.Height = 48;
    this.private.toolbartype = "iconandlabel";
    this.addEventListener('before-child-attached', function(child) {
      try {
        // TODO: Support flex-space
        if(child === "space" || child === "flex-space") {
          var spacer = new $.System.Windows.Shapes.Rectangle();
          spacer.MaxWidth = 1000;
          spacer.MinWidth = 1;
          spacer.Margin = new $.System.Windows.Thickness(15,0,15,0);
          spacer.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Stretch;
          spacer.HorizontalContentAlignment = $.System.Windows.HorizontalAlignment.Stretch;
          child = {native:spacer, nativeView:spacer, private:{}};
        }
        if(child.nativeClass === $.System.Windows.Controls.TextBox) {
          child.native.MinWidth = 50;
          child.native.MaxWidth = 1000;
          if(child.native.Width.toString() === "NaN") {
            child.native.Width = 300;
          }
          child.native.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Stretch;
        }
        if(child.private && child.private.user && child.private.user.width) {
          child.native.MinWidth = child.private.user.width;
          child.native.MaxWidth = 1000;
        }
        if(child.private && child.private.user && child.private.user.height) {
          child.native.MinHeight = child.private.user.height;
          child.native.MaxHeight = 1000;
        }
      } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
      return child;
    }.bind(this));
    this.addEventListener('child-attached', function() {
      resetChildNodes(this);
    }.bind(this));
  }

  Toolbar.prototype = Object.create(Container.prototype);
  Toolbar.prototype.constructor = Toolbar;

  Object.defineProperty(Toolbar.prototype, 'state', {
    get:function() { return this.private.toolbartype; },
    set:function(e) {
      if(e === "icon") {
        this.private.toolbartype = "icon";
      } else if (e === "iconandlabel") {
        this.private.toolbartype = "iconandlabel";
      } else if (e === "label") {
        this.private.toolbartype = "label";
      }
      resetChildNodes(this);
    }
  });

  Object.defineProperty(Toolbar.prototype, 'size', {
    get:function() { 
      if(this.nativeView.Height === 38) {
        return "small";
      } else if (this.nativeView.Height === 42) {
        return "regular";
      } else if (this.nativeView.Height === 48) {
        return "default";
      } else {
        return "unknown";
      }
    },
    set:function(e) {
      if(e === "small") {
        this.nativeView.Height = 38;
      } else if (e === "regular") {
        this.nativeView.Height = 42;
      } else if (e === "default") {
        this.nativeView.Height = 48;
      }
      resetChildNodes(this);
    }
  });

  global.__TINT.Toolbar = Toolbar;
  return Toolbar;
})();