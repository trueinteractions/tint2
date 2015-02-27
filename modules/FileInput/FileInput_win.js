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
    this.private.contextMenu = null;
    this.private.selectedIndex = null;
  }

  FileInput.prototype = Object.create(TextInput.prototype);
  FileInput.prototype.constructor = FileInput;

  util.def(FileInput.prototype, "allowFileTypes",
    function() { return this.private.allowedFileTypes; },
    function(items) { 
      console.assert(Array.isArray(items));

      this.private.allowedFileTypes = items;
      var arr = $.NSMutableArray('arrayWithCapacity',items.length);
      items.forEach(function(item,i) {
        if(item === "folder") {
          item = "public.folder";
        }
        arr('insertObject',$(item),'atIndex',i); 
      });
      this.nativeView('cell')('setAllowedTypes',arr);
    }
  );

  util.def(FileInput.prototype, 'location', 
    function() {
      var url = this.nativeView('URL');
      return url === null ? null : url('absoluteURL')('description')('UTF8String');
    },
    function(value) {
      this.nativeView('setURL', $.NSURL('fileURLWithPath', $(value)));
    }
  );

  global.__TINT.FileInput = FileInput;
  return FileInput;
})();