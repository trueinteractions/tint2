module.exports = (function() {
  if(global.__TINT.FileDialog) {
    return global.__TINT.FileDialog;
  }

  var $ = process.bridge.dotnet;

  function FileDialog(type) {
    var $dialog;

    if(type == "save") { 
      $dialog = new $.Microsoft.Win32.SaveFileDialog();
    } else {
      $dialog = new $.Microsoft.Win32.OpenFileDialog();
    }
    var allowedFileTypes = null, 
        allowAnyFileType = true,
        events = {},
        canChooseDirectories = false,
        message = "",
        prompt = "";

    function fireEvent(event, args) {
      if(events[event]) {
        (events[event]).forEach(function(item,index,arr) {
          item.apply(null,args);
        });
      }
    }

    this.addEventListener = function(event, func) { 
      if(!events[event]) {
        events[event] = [];
      } 
      events[event].push(func);
    }
    this.removeEventListener = function(event, func) {
      if(events[event] && events[event].indexOf(func) !== -1) {
        events[event].splice(events[event].indexOf(func), 1);
      }
    }

    Object.defineProperty(this, "title", {
      get:function() { return $dialog.Title.toString(); },
      set:function(e) { $dialog.Title = e.toString(); }
    });

    // TODO: This isn't supported on windows. 
    Object.defineProperty(this, "message", {
      get:function() { return message; },
      set:function(e) { message = e.toString(); }
    });

    // TODO: This isn't supported on windows. 
    Object.defineProperty(this, "prompt", {
      get:function() { return prompt; },
      set:function(e) { prompt = e.toString(); }
    });

    Object.defineProperty(this, "directory", {
      get:function() { return $dialog.InitialDirectory.toString(); },
      set:function(e) { $dialog.InitialDirectory = $.System.IO.Path.GetFullPath(e.toString()); }
    });

    Object.defineProperty(this, 'filename', {
      get:function() { return $dialog.FileName; },
      set:function(val) { $dialog.FileName = val.toString(); }
    });

    Object.defineProperty(this, 'type', {
      get:function() { return type; }
    });

    var allfiles = "All Files (*.*) | *.*";

    Object.defineProperty(this, 'allowAnyFileType', {
      get:function() { return allowAnyFileType; },
      set:function(val) {
        allowAnyFileType = val ? true : false;
        var b = allowedFileTypes;
        b = b || [];
        if(val && !b.indexOf(allfiles)) {
          b.push(allfiles);
        } else if(!val && b.indexOf(allfiles)) {
          b.splice(b.indexOf(allfiles),1);
        }
        this.allowFileTypes = allowFileTypes;
      }
    });

    Object.defineProperty(this, "allowFileTypes", {
      get:function() { return allowedFileTypes.filter(function(item) { return item === allfiles; }); },
      set:function(items) { 
        console.assert(Array.isArray(items));
        allowedFileTypes = items;
        items = allowedFileTypes;
        for(var i=0; i < items.length ; i++) {
          items[i] = (items[i]).toUpperCase() + ' Files ('+items[i]+') |*.'+items[i];
        }

        if(allowAnyFileType && !items.indexOf(allfiles)) {
          items.push(allfiles);
        }
        $dialog.Filter = items.join('|');
      }
    });

    Object.defineProperty(this, "allowMultiple", {
      get:function() {
        if(type === "save") {
          return false;
        } else {
          return $dialog.Multiselect ? true : false;
        }
      },
      set:function(e) {
        if(type === "save" && e) {
          throw new Error('Save dialogs cannot ask for multiple file paths.');
        } else if(type == "save" && !e) {
          return;
        }
        $dialog.Multiselect = e ? true : false;
      }
    });

    Object.defineProperty(this, "allowDirectories", {
      get:function() {
        if(type === "save") {
          return false;
        } else {
          return canChooseDirectories;
        }
      },
      set:function(e) {
        if(type === "save") {
          return; 
        }
        canChooseDirectories = e ? true : false;
      }
    });

    Object.defineProperty(this, "selection", {
      get:function() {
        if(type === "open") {
          return $dialog.FileNames;
        } else {
          return $dialog.FileNames[0];
        }
      }
    });

    // Not supported on Windows, perhaps add?
    //this.setChild = function(e) { $dialog('setAccessoryView',e); }

    // TODO: Make this asyncronous.
    this.open = function(z) {
      setTimeout(function() {
        if(!$dialog.ShowDialog(z ? z.native : undefined)) {
          fireEvent('cancel');
        } else {
          fireEvent('select');
        }
      }, 100);
    }

    //TODO: This is not supported "native" in windows.
    this.cancel = function() {
      fireEvent('cancel');
      // cannot be executed.
    }
  }
  global.__TINT.FileDialog = FileDialog;
  return FileDialog;
})();
