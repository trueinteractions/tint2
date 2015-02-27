module.exports = (function() {
  if(global.__TINT.FileInput) {
    return global.__TINT.FileInput;
  }

  var TextInput = require('TextInput');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;


  function FileInput(options) {
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
    this.native.ContextMenu = new $.System.Windows.Controls.ContextMenu();
    this.native.ContextMenu.PlacementTarget = this.native;
    this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Center;
    this.private.selectedIndex = null;
  }

  FileInput.prototype = Object.create(TextInput.prototype);
  FileInput.prototype.constructor = FileInput;

  util.def(FileInput.prototype, "allowFileTypes",
    function() { return this.private.allowFileTypes; },
    function(items) { this.private.allowFileTypes = items; }
  );

  util.def(FileInput.prototype, 'location', 
    function() {
      
    },
    function(value) {

    }
  );

  global.__TINT.FileInput = FileInput;
  return FileInput;
})();