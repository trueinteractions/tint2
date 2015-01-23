module.exports = (function() {
  if(global.__TINT.Toolbar) {
    return global.__TINT.Toolbar;
  }
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Toolbar(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.ToolBar;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.ToolBar;
    Container.call(this, options);
    this.nativeView.InternalChildren = this.nativeView.Items;
    this.nativeView.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Stretch;
    this.nativeView.HorizontalContentAlignment = $.System.Windows.HorizontalAlignment.Stretch;
    this.addEventListener('before-child-attached', function(child) {
      try {
        if(child === "space") {
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
      } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
      return child;
    }.bind(this));
  }

  Toolbar.prototype = Object.create(Container.prototype);
  Toolbar.prototype.constructor = Toolbar;

  // TODO: Finish me
  // iconandlabel
  // icon
  // label
  Object.defineProperty(Toolbar.prototype, 'state', {
    get:function() { return "iconandlabel"; },
    set:function(e) { }
  });

  // TODO: Finish me
  // regular
  // small
  // default
  Object.defineProperty(Toolbar.prototype, 'size', {
    get:function() { return "default"; },
    set:function(e) { }
  });

  global.__TINT.Toolbar = Toolbar;
  return Toolbar;
})();