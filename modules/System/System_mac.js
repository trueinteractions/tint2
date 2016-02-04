module.exports = (function() {
  var $ = process.bridge.objc;
  var utils = require('Utilities');
  var path = require('path');
  $.import('ApplicationServices');

  /**
   * @class System
   * @description The system class contains methods for getting OS standard file system icons,
   *        preferences, settings and information.
   */
  function System() {}

  /**
   * @member home
   * @memberof System
   * @description Gets the users home directory, returns it as a string.
   */
  Object.defineProperty(System, 'home', {
    get:function() { return $.NSHomeDirectory().toString(); }
  });

  /**
   * @method getIconForFile
   * @memberof System
   * @param {string} file The path to the file to return its icon used in the system shell.
   * @description Returns an image (data uri base 64 encoded) for the icon used by the system shell.
   */
  System.getIconForFile = function(e) {
    var img = $.NSWorkspace('sharedWorkspace')('iconForFile', $(e));
    return utils.makeURIFromNSImage(img);
  };

  /**
   * @method showFile
   * @memberof System
   * @param {string} file The path to the file or directory to show and select in the systems shell, explorer or finder.
   * @description Shows the location of a file or directory in the system's standard shell, explorer or finder.
   */
  System.showFile = function(file) {
    file = "file://"+encodeURI(file.replace("~",System.home));
    $.NSWorkspace('sharedWorkspace')('activateFileViewerSelectingURLs', utils.arrayToNSArray([$.NSURL('URLWithString',$(file))]));
  };
  /**
   * @method openFile
   * @memberof System
   * @param {string} file The file to open in the default file type handler for the OS.
   * @description Opens the file in the default application thats set to handle it.
   */
  System.openFile = function(file) {
    file = file.replace("~", System.home);
    $.NSWorkspace('sharedWorkspace')('openFile',$(file));
  };
  /**
   * @method openURL
   * @memberof System
   * @param {string} url The url to open in the default web browser.
   * @description Opens the url in the default web browser installed on the OS.
   */
  System.openURL = function(url) {
    $.NSWorkspace('sharedWorkspace')('openURL',$.NSURL('URLWithString',$(url)));
  };
  /**
   * @method trashFile
   * @memberof System
   * @param {string} file The file or directory to move to the trash or recycling bin.
   * @description Moves the file or directory to the recycling bin or trash on the OS.
   */
  System.trashFile = function(file) {
    file = file.replace("~", System.home);
    var dir = path.dirname(file);
    var base = path.basename(file);
    $.NSWorkspace('sharedWorkspace')('performFileOperation', $("recycle"),
                                     'source', $(dir),
                                     'destination', $(""),
                                     'files', utils.arrayToNSArray([base]),
                                     'tag', null);
  };
  /**
   * @method beep
   * @memberof System
   * @description Plays the default alert noise for the OS. This may produce visual effects if the user
   *              has accessibility features enabled.
   */
  System.beep = function() {
    $.NSBeep();
  };

  function writeImageToBase64(image) {
    var bitmapRep = $.NSBitmapImageRep('alloc')('initWithCGImage',image);
    var imageData = bitmapRep('representationUsingType',$.NSPNGFileType, 'properties', null);
    return imageData('base64EncodedStringWithOptions',0).toString();
  }
  function takeSnapshotOfWindowNumber(windowNumber) {
    var image = $.CGWindowListCreateImage($.CGRectNull, $.kCGWindowListOptionIncludingWindow | $.kCGWindowListExcludeDesktopElements, windowNumber, $.kCGWindowImageDefault);
    return writeImageToBase64(image);
  }
  function keyCodeFromChar(keyString)
  {
    switch(keyString) {
      case "a": return 0;
      case "s": return 1;
      case "d": return 2;
      case "f": return 3;
      case "h": return 4;
      case "g": return 5;
      case "z": return 6;
      case "x": return 7;
      case "c": return 8;
      case "v": return 9;
      // what is 10?
      case "b": return 11;
      case "q": return 12;
      case "w": return 13;
      case "e": return 14;
      case "r": return 15;
      case "y": return 16;
      case "t": return 17;
      case "1": return 18;
      case "2": return 19;
      case "3": return 20;
      case "4": return 21;
      case "6": return 22;
      case "5": return 23;
      case "=": return 24;
      case "9": return 25;
      case "7": return 26;
      case "-": return 27;
      case "8": return 28;
      case "0": return 29;
      case "]": return 30;
      case "o": return 31;
      case "u": return 32;
      case "[": return 33;
      case "i": return 34;
      case "p": return 35;
      case "RETURN": return 36;
      case "l": return 37;
      case "j": return 38;
      case "'": return 39;
      case "k": return 40;
      case ";": return 41;
      case "\\": return 42;
      case ",": return 43;
      case "/": return 44;
      case "n": return 45;
      case "m": return 46;
      case ".": return 47;
      case "TAB": return 48;
      case "SPACE": return 49;
      case "`": return 50;
      case "BACK": return 51;
      case "ENTER": return 52;
      case "ESCAPE": return 53;
      // some more missing codes abound, reserved I presume, but it would
      // have been helpful for Apple to have a document with them all listed
      case ".": return 65;
      case "*": return 67;
      case "+": return 69;
      case "CLEAR": return 71;
      case "/": return 75;
      case "ENTER-NUM": return 76;  // numberpad on full kbd
      case "=": return 78;
      case "=": return 81;
      case "0": return 82;
      case "1": return 83;
      case "2": return 84;
      case "3": return 85;
      case "4": return 86;
      case "5": return 87;
      case "6": return 88;
      case "7": return 89;
      case "8": return 91;
      case "9": return 92;
      case "F5": return 96;
      case "F6": return 97;
      case "F7": return 98;
      case "F3": return 99;
      case "F8": return 100;
      case "F9": return 101;
      case "F11": return 103;
      case "F13": return 105;
      case "F14": return 107;
      case "F10": return 109;
      case "F12": return 111;
      case "F15": return 113;
      case "HELP": return 114;
      case "HOME": return 115;
      case "PGUP": return 116;
      case "DELETE": return 117;
      case "F4": return 118;
      case "END": return 119;
      case "F2": return 120;
      case "PGDN": return 121;
      case "F1": return 122;
      case "LEFT": return 123;
      case "RIGHT": return 124;
      case "DOWN": return 125;
      case "UP": return 126;
      default:
        return 0;
    }
  }

  // OSX Specific Types, undocumented on purpose.
  System.disableCrashReporter = function() {
    var exec = require('child_process').exec;
    exec('defaults write com.apple.CrashReporter DialogType none');
  };
  System.enableCrashReporter = function() {
    var exec = require('child_process').exec;
    exec('defaults write com.apple.CrashReporter DialogType crashreport');
  };

  var NSPasteboard = null;

  function convertFormat(inType) {
    switch(inType) {
      case 'html':
        return 'public.html';
      case 'rtf':
        return 'public.rtf';
      case 'bitmap':
      case 'image':
        return 'public.tiff';
      case 'tiff':
        return 'public.tiff';
      case 'text':
      case 'ascii':
        return 'public.utf8-plain-text';
      case 'url':
        return 'public.file-url';
      default:
        return 'public.' + inType;
        break;
    }
    return inType;
  }
  // @private, used by Control
  System.convertFormat = convertFormat;

  function lazyInitPasteboard() {
    if(NSPasteboard === null) {
      NSPasteboard = $.NSPasteboard('generalPasteboard');
    }
  }
  /**
   * @method clipboardClear
   * @memberof System
   * @return {boolean} Whether the clipboard clear was successful or not.
   * @description Clears the clipboards data.
   * @static
   */
  System.clipboardClear = function() {
    lazyInitPasteboard();
    NSPasteboard('clearContents');
    return true;
  }
  /**
   * @method clipboardContainsType
   * @memberof System
   * @param {string} datatype The type to search for data, 'text', 'image', 'rtf', 'html', 'video', 'audio'
   * @description Returns true or false if the type specified is on the clipboard.
   * @return {boolean} Whether the clipboard contains the type specified.
   * @static
   */
  System.clipboardContainsType = function(e) {
    lazyInitPasteboard();
    var arr = $.NSMutableArray('arrayWithCapacity', 1);
    arr('insertObject', $(e), 'atIndex', 0);
    return NSPasteboard('canReadItemWithDataConformingToTypes', arr) ? true : false;
  }
  /**
   * @method clipboardGet
   * @memberof System
   * @param {string} datatype The type to search for data, 'text', 'image', 'rtf', 'html', 'video', 'audio'
   * @description Gets the clipboard data, for text data a string is returned, for binary data a Buffer object is.
   *              In addition, this may return native objects as fully formed javascript objects depending on the type.
   * @return {Buffer} A node Buffer object with the requested data or false if the operation was unsuccessful.
   * @static
   */
  System.clipboardGet = function(type) {
    lazyInitPasteboard();
    var b = NSPasteboard('dataForType',$(convertFormat(type)));
    if(b === null) {
      return null;
    }
    var b64 = b('base64EncodedStringWithOptions',0).toString();
    return new Buffer(b64,'base64');
  }
  /**
   * @method clipboardSet
   * @memberof System
   * @param {string} data The data to set on the clipboard (Buffer data or string usually).
   * @param {string} datatype The type to search for data, 'text', 'image', 'rtf', 'html', 'video', 'audio'
   * @description Sets the clipboards data and adds the specified type to it. The type is case sensitive.
   * @returns {Object} An object with one function, "release" which releases the data back to memory once
   *                   it should no longer be available in the clipboard.  IMPORTANT: Data placed in the
   *                   clipboard is not automatically memory managed on some platforms, ensure you release
   *                   data before setting new data on the clipboard as a precautionary measure. Note if an
   *                   error occurs this operation returns false.
   * @static
   */
  System.clipboardSet = function(data, type) {
    lazyInitPasteboard();
    NSPasteboard('clearContents');
    var data = $(new Buffer(data));
    data('retain');
    var e = NSPasteboard('setData', data, 'forType', $(convertFormat(type)));
    return {release:function() { data('release'); }, native:e};
  }

  /**
   * @member mousePosition
   * @memberof System
   * @description Contains an object with the 'x' and 'y' properties with the current position of
   *              the mouse cursor in context to the active screen.
   * @static
   */
  Object.defineProperty(System, 'mousePosition', {
    get:function() {
      var val = $.NSEvent('mouseLocation');
      var frame = $.NSScreen('mainScreen')('frame');
      return {x:(val.x), y:(frame.size.height - val.y)};
    }
  });

  /**
   * @method mouseDownAt
   * @memberof System
   * @param {integer} x The amount of pixels from the left of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @param {integer} y The amount of pixels from the top of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @description Sends a left 'mouse down' at the specified X, Y coordinates. This causes a
   *              real left click mouse down event within the operating system
   *              at the specified coordinates and is not simulated. This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.mouseDownAt = function(x,y) {
    var point = $.CGPointMake(x, y);
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
  };
  /**
   * @method mouseUpAt
   * @memberof System
   * @param {integer} x The amount of pixels from the left of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @param {integer} y The amount of pixels from the top of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @description Sends a left 'mouse up' at the specified X, Y coordinates. This causes a
   *              real left click mouse up event within the operating system
   *              at the specified coordinates and is not simulated.  This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.mouseUpAt = function(x,y) {
    var point = $.CGPointMake(x, y);
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));
  };

  /**
   * @method sendKey
   * @memberof System
   * @param {string} input The character to send as a key up and key down event. Note this must be one single character
   *                       e.g., 'a', 'b', or 'A', or 'B'.  For a carrage return use 'ENTER' or 'RETURN', for shift use
   *                       'SHIFT', etc.
   * @description Sends a key down and key up event through the OS, note the currently focused application, window and
   *              control will receive this event (and may not be the running application).  This is mainly used for
   *              testing and should be avoided in production applications.
   * @alias keyAtControl
   * @static
   */
  System.sendKey = System.keyAtControl = function(input) {
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, keyCodeFromChar(input), true));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, keyCodeFromChar(input), false));
  };
  /**
   * @method scrollAt
   * @memberof System
   * @param {integer} x The amount of pixels from the left of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @param {integer} y The amount of pixels from the top of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @param {boolean} upOrDown The direction to scroll vertically up or down (true/false).
   * @description Sends a scroll event through the operating system at the specified X, Y
   *              coordinates, note this is not simulated. This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.scrollAt = function(x, y, upOrDown) {
    var point = $.CGPointMake(x, y);
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateScrollWheelEvent($.kCGScrollEventUnitPixel, 1, upOrDown));
  };
  /**
   * @method scrollAtControl
   * @memberof System
   * @param {Control} control The control to scroll.
   * @param {boolean} upOrDown The direction to scroll vertically up or down (true/false).
   * @description Scrolls a control vertically up or down based on the value of upOrDown. This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.scrollAtControl = function(control, upOrDown) {
    var bounds = control.boundsOnScreen;
    bounds.x = bounds.x + bounds.width/2;
    bounds.y = bounds.y + bounds.height/2;
    var point = $.CGPointMake(bounds.x, bounds.y);
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
    var scrollEvent = $.CGEventCreateScrollWheelEvent(null, 1, 1, upOrDown);
    $.CGEventPost($.kCGHIDEventTap, scrollEvent);
  };
  /**
   * @method clickAt
   * @memberof System
   * @param {integer} x The amount of pixels from the left of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @param {integer} y The amount of pixels from the top of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @description Left clicks at the specified X, Y coordinates. This causes a
   *              real left click mouse event within the operating system
   *              at the specified coordinates and is not simulated. This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.clickAt = function(x,y) {
    var point = $.CGPointMake(x, y);
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));
  };
  /**
   * @method clickAtControl
   * @memberof System
   * @param {Control} control The control to left click at.  The center of the control is
   *                          calculated as the target click area.
   * @description Left clicks at the center of the specified Tint Control. This causes a
   *              real left click event within the operating system and is not simulated. This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.clickAtControl = function(control) {
    var bounds = control.boundsOnScreen;
    bounds.x = bounds.x + bounds.width/2;
    bounds.y = bounds.y + bounds.height/2;
    System.clickAt(bounds.x, bounds.y);
  };

  /**
   * @method rightClickAt
   * @memberof System
   * @param {integer} x The amount of pixels from the left of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @param {integer} y The amount of pixels from the top of the virtual screen (e.g., all
   *                    of the connected monitors normalized into a coordinate system).
   * @description Right clicks at the specified control. This causes a
   *              real right-click mouse event within the operating system
   *              at the specified coordinates and is not simulated. This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.rightClickAt = function (x,y) {
    var point = $.CGPointMake(x, y);
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventRightMouseDown, point, 0));
    $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventRightMouseUp, point, 0));
  };

  /**
   * @method rightClickAtControl
   * @memberof System
   * @param {Control} control The control to right click at.  The center of the control is
   *                          calculated as the target click area.
   * @description The right click at control method can be used for testing.  This causes a
   *              real right-click event within the operating system and is not simulated. This is mainly used for
   *              testing and should be avoided in production applications.
   * @static
   */
  System.rightClickAtControl = function(control) {
    var bounds = control.boundsOnScreen;
    bounds.x = bounds.x + bounds.width/2;
    bounds.y = bounds.y + bounds.height/2;
    System.rightClickAt(bounds.x, bounds.y);
  };

  /**
   * @method takeSnapshotOfActiveScreen
   * @memberof System
   * @returns {string} A base 64 encoded PNG of the screenshot.
   * @description Takes a screenshot of the current active screen and returns it as a
   *              string that is a base64 encoded PNG image.
   * @static
   */
  System.takeSnapshotOfActiveScreen = function() {
    var image = $.CGWindowListCreateImage($.CGRectInfinite, $.kCGWindowListOptionAll, $.kCGNullWindowID, $.kCGWindowImageDefault);
    return writeImageToBase64(image);
  };

  /**
   * @method takeSnapshotOfTopWindow
   * @memberof System
   * @returns {string} A base 64 encoded PNG of the screenshot.
   * @description Takes a screenshot of the current top (but not necessarily focused) window in the running application.
   * @static
   */
  System.takeSnapshotOfTopWindow = function() {
    var image = $.CGWindowListCreateImage($.CGRectNull, $.kCGWindowListExcludeDesktopElements, 1, $.kCGWindowImageDefault);
    return writeImageToBase64(image);
  };

  /**
   * @method takeSnapshotOfCurrentWindow
   * @memberof System
   * @returns {string} A base 64 encoded PNG of the screenshot.
   * @description Takes a screenshot of the current focused window in the running application.
   * @static
   */
  System.takeSnapshotOfCurrentWindow = function() {
    var currentWindow = $.NSApplication('sharedApplication')('mainWindow');
    if(currentWindow) {
      var windowNumber = currentWindow('windowNumber');
      return takeSnapshotOfWindowNumber(windowNumber);
    }
  };

  /**
   * @method takeSnapshotOfWindow
   * @memberof System
   * @param {Window} window The window object to take a snapshot of.
   * @returns {string} A base 64 encoded PNG of the screenshot.
   * @description Takes a screenshot of the window passed in and returns a base 64 encoded string
   *              that represents a PNG image.
   * @static
   */
  System.takeSnapshotOfWindow = function(windowObj) {
    var windowNumber = windowObj.native('windowNumber');
    return takeSnapshotOfWindowNumber(windowNumber);
  };

  /**
   * @method takeSnapshotOfControl
   * @memberof System
   * @param {Control} control The Tint control to take a snapshot of.
   * @returns {string} A base 64 encoded PNG of the snapshot.
   * @description Takes a snapshot of a Tint Control and returns back a base 64 encoded string that
   *              represents a PNG image.
   * @static
   */
  System.takeSnapshotOfControl = function(c) {
    var img = $.NSImage('alloc')('initWithData', c.nativeView('dataWithPDFInsideRect',c.nativeView('bounds')));
    var bitmapRep = $.NSBitmapImageRep('alloc')('initWithData',img('TIFFRepresentation'));
    var imageData = bitmapRep('representationUsingType',$.NSPNGFileType, 'properties', null);
    return imageData('base64EncodedStringWithOptions',0);
  };

  return System;
})();
