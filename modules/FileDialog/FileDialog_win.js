module.exports = (function() {
  if(global.__TINT.FileDialog) {
    return global.__TINT.FileDialog;
  }

  var $ = process.bridge.dotnet;
  process.bridge.dotnet.import('System.Windows.Forms.dll'); 
  var util = require('Utilities');
  var assert = require('assert');

  var type = null;
  function FileDialog(t) {
    type = t || "open";
    var $dialog;
    var $dirDialog = new $.System.Windows.Forms.FolderBrowserDialog();

    if(type === "save") { 
      $dialog = new $.Microsoft.Win32.SaveFileDialog();
    } else {
      $dialog = new $.Microsoft.Win32.OpenFileDialog();
    }
    var allowedFileTypes = null, 
        allowAnyFileType = true,
        canChooseDirectories = false,
        message = "",
        prompt = "";

    util.defEvents(this);

    Object.defineProperty(this, "title", {
      get:function() { 
        if(canChooseDirectories) {
          return "";
        } else {
          return $dialog.Title.toString();
        }
      },
      set:function(e) {
        if(!canChooseDirectories) {
          $dialog.Title = e.toString();
        }
      }
    });

    // TODO: This isn't supported on windows. 
    Object.defineProperty(this, "message", {
      get:function() {
        if(canChooseDirectories) {
          return $dirDialog.Description.toString();
        } else {
          return message;
        }
      },
      set:function(e) {
        if(canChooseDirectories) {
          $dirDialog.Description = e.toString();
        } else {
          message = e.toString();
        }
      }
    });

    // TODO: This isn't supported on windows. 
    Object.defineProperty(this, "prompt", {
      get:function() { return prompt; },
      set:function(e) { prompt = e.toString(); }
    });

    Object.defineProperty(this, "directory", {
      get:function() {
        if(canChooseDirectories) {
          return $dirDialog.SelectedPath.toString();
        } else {
          return $dialog.InitialDirectory.toString();
        }
      },
      set:function(e) { 
        if(canChooseDirectories) {
          $dirDialog.SelectedPath = $.System.IO.Path.GetFullPath(e.toString());
        } else {
          $dialog.InitialDirectory = $.System.IO.Path.GetFullPath(e.toString());
        }
      }
    });

    Object.defineProperty(this, 'filename', {
      get:function() { 
        if(canChooseDirectories) {
          return null;
        } else {
          return $dialog.FileName;
        }
      },
      set:function(val) {
        if(!canChooseDirectories) {
          $dialog.FileName = val.toString();
        }
      }
    });

    Object.defineProperty(this, 'type', {
      get:function() { return type; },
      set:function() {
        console.warn('ERROR! The type for a FileDialog must be set in the constructor, not as a property.');
      }
    });

    var allfiles = "All Files (*.*) | *.*";

    Object.defineProperty(this, 'allowAnyFileType', {
      get:function() { return allowAnyFileType; },
      set:function(val) {
        assert(allowedFileTypes !== null || val, 'Not allowing all file type, yet not setting a file type with allowFileTypes doesnt make sense.');
        allowAnyFileType = val ? true : false;
        allowedFileTypes = allowedFileTypes || [];
        if(val && !allowedFileTypes.indexOf(allfiles)) {
          allowedFileTypes.push(allfiles);
        } else if(!val && allowedFileTypes.indexOf(allfiles)) {
          allowedFileTypes.splice(allowedFileTypes.indexOf(allfiles),1);
        }
        this.allowFileTypes = allowedFileTypes;
      }
    });

    Object.defineProperty(this, "allowFileTypes", {
      get:function() { 
        if(allowedFileTypes)
          return allowedFileTypes.filter(function(item) { return item === allfiles; });
        else
          return [];
      },
      set:function(items) {
        console.assert(Array.isArray(items), 'The allowFileTypes property must be an array of file types to allow, e.g., ["exe","png","jpg"]');
        allowedFileTypes = [];
        for(var i=0; i < items.length ; i++) {
          if(items[i] === "folder") {
            this.allowDirectories = true;
          } else {
            allowedFileTypes.push((items[i]).toUpperCase() + ' Files ('+items[i]+') |*.'+items[i]);
          }
        }

        if(allowAnyFileType && !allowedFileTypes.indexOf(allfiles)) {
          allowedFileTypes.push(allfiles);
        }
        if(!canChooseDirectories) {
          $dialog.Filter = allowedFileTypes.join('|');
        }
      }
    });

    Object.defineProperty(this, "allowMultiple", {
      get:function() {
        if(canChooseDirectories) {
          return false;
        } else if(type === "save") {
          return false;
        } else {
          return $dialog.Multiselect ? true : false;
        }
      },
      set:function(e) {
        if(canChooseDirectories) {
          throw new Error('Only one folder can be selected at a time.');
        } else if(type === "save" && e) {
          throw new Error('Save dialogs cannot ask for multiple file paths.');
        } else if(type === "save" && !e) {
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
        if(canChooseDirectories) {
          return type === "open" ? [$dirDialog.SelectedPath] : $dirDialog.SelectedPath;
        } else if(type === "open") {
          var result = [];
          var amount = $dialog.FileNames.Length;
          for(var i=0; i < amount; i++) {
            result.push($dialog.FileNames.GetValue(i).toString());
          }
          return result;
        } else {
          return $dialog.FileNames.GetValue(0).toString();
        }
      }
    });

    // Not supported on Windows, perhaps add?
    //this.setChild = function(e) { $dialog('setAccessoryView',e); }

    // TODO: Make this asyncronous.
    this.open = function(z) {
      setTimeout(function() {
        if(canChooseDirectories) {
          if(!$dirDialog.ShowDialog()) {
            this.fireEvent('cancel');
          } else {
            this.fireEvent('select');
          }
        } else {
          if(z) {
            if(!$dialog.ShowDialog(z.native)) {
              this.fireEvent('cancel');
            } else {
              this.fireEvent('select');
            }
          } else {
            if(!$dialog.ShowDialog()) {
              this.fireEvent('cancel');
            } else {
              this.fireEvent('select');
            }
          }
        }
        
        
      }.bind(this), 100);
    }

    //TODO: This is not supported "native" in windows.
    this.cancel = function() {
      this.fireEvent('cancel');
      // cannot be executed.
    }
  }
  global.__TINT.FileDialog = FileDialog;
  return FileDialog;
})();
