module.exports = (function() {
  if(global.__TINT.ToolbarItem) {
    return global.__TINT.ToolbarItem;
  }
  var util = require('Utilities');

  function ToolbarItem() {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Button;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Button;
    Container.call(this, options);
    this.private.tooltip = new $.System.Windows.Controls.ToolTip();
  }

  util.makePropertyStringType(ToolbarItem.prototype, 'title', 'Content');

  util.def(ToolbarItem.prototype, 'tooltip', 
    function() { return this.private.tooltip.Content.toString(); },
    function(e) { this.private.tooltip.Content = e.toString(); }
  );

  util.makePropertyImageType(ToolbarItem.prototype, 'image', 'Content');

  util.makePropertyBoolType(ToolbarItem.prototype, 'enabled', 'IsEnabled', true, false);

  util.defEvents(ToolbarItem.prototype);

  global.__TINT.ToolbarItem = ToolbarItem;
  return ToolbarItem;
})();