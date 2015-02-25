module.exports = (function() {
  if(global.__TINT.ToolbarItem) {
    return global.__TINT.ToolbarItem;
  }
  var util = require('Utilities');
  var $ = process.bridge.dotnet;

  function ToolbarItem(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Button;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Button;
    Container.call(this, options);
    this.private.stack = new $.System.Windows.Controls.StackPanel();
    this.private.stack.Orentation = $.System.Windows.Controls.Vertical;
    this.private.label = new $.System.Windows.Controls.Label();
    this.private.label.TextAlignment = $.System.Windows.TextAlignment.Center;
    this.private.label.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Stretch;
    this.private.label.HorizontalContentAlignment = $.System.Windows.HorizontalAlignment.Stretch;
    this.private.label.Margin = new $.System.Windows.Thickness(0);
    this.private.label.Padding = new $.System.Windows.Thickness(5,0,5,0);
    this.private.image = new $.System.Windows.Controls.Image();
    this.private.image.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Center;
    this.private.image.HorizontalContentAlignment = $.System.Windows.HorizontalAlignment.Center;
    this.private.image.VerticalAlignment = $.System.Windows.VerticalAlignment.Stretch;
    this.private.image.VerticalContentAlignment = $.System.Windows.VerticalAlignment.Stretch;
    this.private.image.Height = 24;
    this.private.image.Width = 24;
    this.private.stack.Children.Add(this.private.image);
    this.private.stack.Children.Add(this.private.label);
    this.nativeView.Content = this.private.stack;
    this.private.tooltip = "";
    this.private.type = "ToolbarItem"; // needed by Toolbar
  }

  ToolbarItem.prototype = Object.create(Container.prototype);
  ToolbarItem.prototype.constructor = ToolbarItem;

  util.def(ToolbarItem.prototype, 'title', 
    function() { return this.private.label.Content.toString(); },
    function(e) { this.private.label.Content = e.toString(); }
  );

  // todo: Adding a tooltip makes a webview content disappear,
  // we need to fix this.
  util.def(ToolbarItem.prototype, 'tooltip', 
    function() { return this.private.tooltip; },
    function(e) { this.private.tooltip = e; }
  );

  util.def(ToolbarItem.prototype, 'image', 
    function() { return this.private.imageName; },
    function(e) { 
      this.private.imageName = e;
      var img = util.makeImage(e, $.System.Windows.Media.Stretch.Uniform);
      this.private.image.Source = img.Source;
    }
  );
  util.makePropertyBoolType(ToolbarItem.prototype, 'enabled', 'IsEnabled', true, false);

  util.defEvents(ToolbarItem.prototype);

  global.__TINT.ToolbarItem = ToolbarItem;
  return ToolbarItem;
})();