module.exports = (function() {
  if(global.__TINT.FileInput) {
    return global.__TINT.FileInput;
  }

  var TextInput = require('TextInput');
  var FileDialog = require('FileDialog');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;

  function createchoose() {
    var item = new $.System.Windows.Controls.MenuItem();
    item.previewMouseDown = function() {

      var dialog = new FileDialog("open");
      dialog.allowMultiple = false;

      if(this.allowFileTypes) {
        dialog.allowFileTypes = this.allowFileTypes;
      }
      if(this.location) {
        dialog.selection = this.location;
      }
      dialog.addEventListener('select', function() {
        var sel = dialog.selection;
        this.location = sel;
      }.bind(this));
      dialog.addEventListener('cancel', function() {
        // TODO ?? //
      }.bind(this));

      dialog.open({native:$.System.Windows.Application.Current.MainWindow});
    };
    item.addEventListener('PreviewMouseDown', item.previewMouseDown.bind(this));
    item.Header = "Choose ...";
    return item;
  }

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
    this.private.location = null;
    this.native.ContextMenu = new $.System.Windows.Controls.ContextMenu();
    this.native.ContextMenu.PlacementTarget = this.native;
    this.native.ContextMenu.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Center;

    var item = createchoose.call(this);
    this.native.ContextMenu.Items.Add(item);

    setTimeout(function() {
      this.native.ContextMenu.MinWidth = this.native.ActualWidth;
      this.private.sizeChangedHandler = function() {
        this.native.ContextMenu.MinWidth = this.native.ActualWidth;
      }.bind(this);
      this.native.addEventListener('SizeChanged', this.private.sizeChangedHandler);
    }.bind(this),0);
  }

  FileInput.prototype = Object.create(TextInput.prototype);
  FileInput.prototype.constructor = FileInput;

  util.def(FileInput.prototype, "allowFileTypes",
    function() { return this.private.allowFileTypes; },
    function(items) { this.private.allowFileTypes = items; }
  );

  util.def(FileInput.prototype, 'location', 
    function() { return this.private.location; },
    function(value) {
      this.native.ContextMenu.Items.Clear();
      var item = createchoose.call(this);
      this.native.ContextMenu.Items.Add(item);

      value = value.replace(/\\/g, '\\');
      var paths = value.split('\\');
      var runningPath = "", previousPath = "";
      for(var i=0; i < paths.length; i++) {
        runningPath = runningPath + paths[i] + ((i === (paths.length - 1)) ? "" : "\\");
        if(runningPath !== previousPath) {
          var menuItem = new $.System.Windows.Controls.MenuItem();
          menuItem.Header = runningPath;
          menuItem.selector = function() {
            this.native.SelectionBoxItem = menuItem.Header;
          };
          menuItem.addEventListener('PreviewMouseDown', menuItem.selector.bind(this));
          var img = new $.System.Windows.Controls.Image();
          var fromFileIcon = $.TintInterop.Shell.GetIconForFile(runningPath);
          if(fromFileIcon) {
            img.Source = $.System.Windows.Media.Imaging.BitmapFrame.Create(
              new $.System.IO.MemoryStream($.System.Convert.FromBase64String(fromFileIcon)));
            menuItem.Icon = img;
          }
          this.native.ContextMenu.Items.Add(menuItem);
        }
        previousPath = runningPath;
      }
      this.private.location = value;
      this.native.SelectionBoxItem = value;
    }
  );

  global.__TINT.FileInput = FileInput;
  return FileInput;
})();

