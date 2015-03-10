module.exports = (function() {
  if(global.__TINT.ToolbarItem) {
    return global.__TINT.ToolbarItem;
  }
  var Button = require('Button');
  var util = require('Utilities');

  function ToolbarItem(options) {
    options = options || {};
    Button.call(this, options);
    this.private.tooltip = "";
    this.private.type = "ToolbarItem"; // needed by Toolbar
  }

  ToolbarItem.prototype = Object.create(Button.prototype);
  ToolbarItem.prototype.constructor = ToolbarItem;

  // todo: Adding a tooltip makes a webview content disappear,
  // we need to fix this.
  util.def(ToolbarItem.prototype, 'tooltip', 
    function() { return this.private.tooltip; },
    function(e) { this.private.tooltip = e; }
  );

  util.defEvents(ToolbarItem.prototype);

  global.__TINT.ToolbarItem = ToolbarItem;
  return ToolbarItem;
})();