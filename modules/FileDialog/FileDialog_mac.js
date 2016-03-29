module.exports = (function() {
  if(global.__TINT.FileDialog) {
    return global.__TINT.FileDialog;
  }
  var $ = process.bridge.objc;
  var util = require('Utilities');
  var assert = require('assert');
  /**
    * @class FileDialog
    * @description Creates a new file dialog where a user can select a file to open or save.
    * @extends Container
    */
  /**
    * @new
    * @memberof FileDialog
    * @param {string} type The type of file dialog, can be "save" or "open".  Default is open if no parameter is passed in.
    * @description Creates a new FileDialog window that is not shown by default.
    */
  /**
   * @event select
   * @memberof FileDialog
   * @description Fires when a user selects the a file or set of files. 
   */
  /**
   * @event cancel
   * @memberof FileDialog
   * @description Fires when a user cancels the selection. 
   */
  function FileDialog(type) {
    type = type || "open";
    var $dialog = (type === "save") ? $.NSSavePanel('savePanel') : $.NSOpenPanel('openPanel');
    var allowedFileTypes = null;
    this.private = {events:{}};

    $dialog('setCanCreateDirectories', $.YES);

    /**
     * @method addEventListener
     * @param {string} eventName The name of the dialog event to start listening to.
     * @param {function} callback The function that will be called when it occurs.
     * @memberof FileDialog
     * @description Adds an event listener for various dialog level events. The first
     *              parameter is the name of the event, the second parameter is the function
     *              to call when the event happens (e.g., a callback).
     */
    /**
     * @method removeEventListener
     * @param {string} eventName The name of the dialog event to stop listening to.
     * @param {function} callback The function that would have been called.
     * @memberof FileDialog
     * @description Removes an event listener for various dialog level events. The first
     *              parameter is the name of the event, the second parameter is the function
     *              that was originally given as the callback for addEventListener.
     */
     util.defEvents(this);

    /**
     * @member title
     * @type {string}
     * @memberof FileDialog
     * @description Gets or sets the title for the file dialog window.
     */
    Object.defineProperty(this, "title", {
      get:function() { return $dialog('title')('description')('UTF8String'); },
      set:function(e) { $dialog('setTitle', $(e)); }
    });

    // TODO: Not supported on windows.
    Object.defineProperty(this, "message", {
      get:function() { return $dialog('message')('description')('UTF8String'); },
      set:function(e) { $dialog('setMessage', $(e)); }
    });

    // TODO: Not supported on windows.
    Object.defineProperty(this, "prompt", {
      get:function() { return $dialog('prompt')('description')('UTF8String'); },
      set:function(e) { $dialog('setPrompt', $(e)); }
    });

    /**
     * @member directory
     * @type {string}
     * @memberof FileDialog
     * @description Gets or sets the directory the file dialog is in.
     */
    Object.defineProperty(this, "directory", {
      get:function() { return $dialog('directoryURL')('absoluteString'); },
      set:function(e) { $dialog('setDirectoryURL', $.NSURL('URLWithString',$(e))); }
    });

    /**
     * @member filename
     * @type {string}
     * @memberof FileDialog
     * @description Gets or sets the filename the file dialog has (specified by the user).
     */
    Object.defineProperty(this, 'filename', {
      get:function() { return $dialog('nameFieldStringValue')('description')('UTF8String'); },
      set:function(val) { $dialog('setNameFieldStringValue', $(val)); }
    });

    /**
     * @member type
     * @type {string}
     * @memberof FileDialog
     * @description Gets the type of the file dialog (open or save). This is read only.
     */
    Object.defineProperty(this, 'type', {
      get:function() { return type; },
      set:function() {
        console.warn('ERROR! The type for a FileDialog must be set in the constructor, not as a property.');
      }
    });

    /**
     * @member allowAnyFileType
     * @type {boolean}
     * @memberof FileDialog
     * @description Gets or sets whether the use can select any file type.
     */
    Object.defineProperty(this, 'allowAnyFileType', {
      get:function() { return $dialog('allowsOtherFileTypes') ? true : false; },
      set:function(val) { 
        assert(allowedFileTypes !== null || val, 'Not allowing any file type, yet not setting a file type with allowFileTypes doesnt make sense.');
        $dialog('setAllowsOtherFileTypes', val ? $.YES : $.NO); 
      }
    });

    /**
     * @member allowFileTypes
     * @type {array}
     * @memberof FileDialog
     * @description Gets or sets an array containing the file types (by extension) that are allowed.
     */
    Object.defineProperty(this, "allowFileTypes", {
      get:function() { return allowedFileTypes ? allowedFileTypes : []; },
      set:function(items) { 
        console.assert(Array.isArray(items), 'The allowFileTypes property must be an array of file types to allow, e.g., ["exe","png","jpg"]');
        allowedFileTypes = items;
        var arr = $.NSMutableArray('arrayWithCapacity',items.length);
        items.forEach(function(item,i) {
          if(item === "folder") {
            item = "public.folder";
          }
          arr('insertObject',$(item),'atIndex',i);
        });
        $dialog('setAllowedFileTypes',arr);
      }
    });

    /**
     * @member allowMultiple
     * @type {boolean}
     * @memberof FileDialog
     * @description Gets or sets whether selecting multiple files is allowed, if the file dialog is a 
     *              save dialog type this value is ignored.
     */
    Object.defineProperty(this, "allowMultiple", {
      get:function() {
        if(type === "save") {
          return false;
        }
        return $dialog('allowsMultipleSelection') ? true : false;
      },
      set:function(e) {
        if(type === "save" && e) {
          throw new Error('Save dialogs cannot ask for multiple file paths.');
        } else if(type === "save" && !e) {
          return;
        }
        $dialog('setAllowsMultipleSelection',e); 
      }
    });

    /**
     * @member allowDirectories
     * @type {boolean}
     * @memberof FileDialog
     * @description Gets or sets if the user is allowed to select a directory in addition to a file.
     */
    Object.defineProperty(this, "allowDirectories", {
      get:function() {
        if(type === "save") {
          return false;
        }
        return $dialog('canChooseDirectories') ? true : false;
      },
      set:function(e) {
        if(type === "save") {
          return;
        }
        $dialog('setCanChooseDirectories', e ? true : false);
      }
    });

    /**
     * @member selection
     * @type {string}
     * @memberof FileDialog
     * @description Gets the selection specified by the user once the dialog has been closed. The result is a URL or file path.
     */
    var selectedUrls = null;
    Object.defineProperty(this, "selection", {
      get:function() {
        if(type === "open") {
          if(selectedUrls) {
            return selectedUrls;
          }
          var urls = $dialog('URLs');
          var count = urls('count');
          var result = [];
          for(var i=0; i < count; i++) {
            result.push(decodeURI(urls('objectAtIndex',i)('absoluteString')('UTF8String').replace('file://','')));
          }
          return result;
        } else {
          return decodeURI($dialog('URL')('absoluteString')('UTF8String').replace('file://',''));
        }
      }
    });

    // Not supported on Windows.
    //this.setChild = function(e) { $dialog('setAccessoryView',e); }

    /**
     * @method open
     * @param {Window} window The window to associate with this file dialog.
     * @memberof FileDialog
     * @description Opens the file dialog window, if a window object is passed in the file dialog is placed
     *              on top of the passed in window preventing any user interaction with it. On OSX this causes
     *              a "sheet" effect, on Windows the file dialog is a modal window aligned with the passed in window.
     *              Note: Because of security and sandboxing on applications all event loops are paused until a 
     *              selection is made by the user
     */
    this.open = function(z) {
      var w = z ? z : $.NSApplication('sharedApplication')('mainWindow');
      if(w) {
        w = w.native ? w.native : w;
        var comp = $(function(self,e) {
          if(e === $.NSFileHandlingPanelOKButton) {
            if(type === 'open') {
              selectedUrls = this.selection;
            }
            this.fireEvent('select');
          } else {
            this.fireEvent('cancel');
          }
        }.bind(this),[$.void,['?',$.long]]);
        $dialog('beginSheetModalForWindow',w,'completionHandler',comp);
      } else {
        var e = $dialog('runModal');
        if(e === $.NSFileHandlingPanelOKButton) {
          if(type === 'open') {
            selectedUrls = this.selection;
          }
          this.fireEvent('select');
        } else {
          this.fireEvent('cancel');
        }
      }
    }

    // TODO: Not supported by windows.
    this.cancel = function() {
      $dialog('cancel',$dialog);
    }
  };

  global.__TINT.FileDialog = FileDialog;

  return FileDialog;

})();
