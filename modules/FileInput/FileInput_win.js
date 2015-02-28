module.exports = (function() {
  if(global.__TINT.FileInput) {
    return global.__TINT.FileInput;
  }

  var TextInput = require('TextInput');
  var FileDialog = require('FileDialog');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;


  function FileInput(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.ComboBox;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.ComboBox;
    TextInput.call(this, options);
    this.private.previewMouseDownHandler = function() {
      if(this.native.ContextMenu) {
        this.native.ContextMenu.IsOpen = !this.native.ContextMenu.IsOpen;
      }
    }.bind(this);
    this.native.addEventListener('PreviewMouseDown', this.private.previewMouseDownHandler);
    this.private.menu = null;
    this.native.ContextMenu = new $.System.Windows.Controls.ContextMenu();
    this.native.ContextMenu.PlacementTarget = this.native;
    this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Center;

    var item = new $.System.Windows.Controls.MenuItem();
    item.addEventListener('PreviewMouseDown', function() {
  
      var dialog = new FileDialog("open");
      dialog.allowMultiple = false;

      if(this.allowFileTypes) {
        dialog.allowFileTypes = this.allowFileTypes;
      }
      if(this.location) {
        dialog.filename = this.location;
      }
      dialog.addEventListener('select', function() {
        // TODO ?? //
        this.location = dialog.filename;
      }.bind(this));
      dialog.addEventListener('cancel', function() {
        // TODO ?? //
      }.bind(this));

      dialog.open();
    }.bind(this));

    item.Header = "Choose ...";
    this.native.ContextMenu.Items.Add(item);
    this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Center;

    setTimeout(function() {
      this.native.ContextMenu.MinWidth = this.native.ActualWidth;
      this.private.sizeChangedHandler = function() {
        this.native.ContextMenu.MinWidth = this.native.ActualWidth;
      }.bind(this);
      this.native.addEventListener('SizeChanged', this.private.sizeChangedHandler);
    }.bind(this),0);

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