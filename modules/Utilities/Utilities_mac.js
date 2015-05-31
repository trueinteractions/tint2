module.exports = (function() {
  if(global.__TINT.Utilities) {
    return global.__TINT.Utilities;
  }
  var assert = require('assert');
  var baseUtilities = require('Utilities_base');
  var $ = process.bridge.objc;
  var path = require('path');

  function nsArrayToArray(nsArray) {
    var count = nsArray('count');
    var values = [];
    for(var i=0; i < count; i++) {
      values.push(nsArray('objectAtIndex',i));
    }
    return values;
  }

  function arrayToNSArray(arr) {
    var nsarray = $.NSMutableArray('arrayWithCapacity',arr.length);
    for(var i=0; i < arr.length; i++) {
      if(typeof(arr[i]) === 'string') {
        arr[i] = $(arr[i]);
      }
      nsarray('insertObject', arr[i], 'atIndex', i);
    }
    return nsarray;
  }

  function nsDictionaryToObject(nsdictionary) {
    var allKeys = nsdictionary('allKeys');
    var count = allKeys('count');
    var values = [];
    for(var i=0; i < count; i++) {
      values[allKeys('objectAtIndex',i)('description')('UTF8String')] = nsdictionary('objectForKey',allKeys('objectAtIndex',i))('description')('UTF8String');
    }
    return values;
  }

  function getImageFromString(e) {
    var imageRef = null;
    switch(e) {
      case 'action':
        imageRef = "NSActionTemplate";
        break;
      case 'share':
        imageRef = "NSShareTemplate";
        break;
      case 'view-as-objects':
        imageRef = "NSIconViewTemplate";
        break;
      case 'view-as-list':
        imageRef = "NSListViewTemplate";
        break;
      case 'view-as-tree':
        imageRef = "NSPathTemplate";
        break;
      case 'view-as-preview':
        imageRef = "NSFlowViewTemplate";
        break;
      case 'view-as-columns':
        imageRef = "NSColumnViewTemplate";
        break;
      case 'unlock':
        imageRef = "NSLockLockedTemplate";
        break;
      case 'lock':
        imageRef = "NSLockUnlockedTemplate";
        break;
      case 'forward':
        imageRef = "NSGoRightTemplate";
        break;
      case 'back':
        imageRef = "NSGoLeftTemplate";
        break;
      case 'add':
        imageRef = "NSAddTemplate";
        break;
      case 'remove':
        imageRef = "NSRemoveTemplate";
        break;
      case 'stop':
        imageRef = "NSStopProgressTemplate";
        break;
      case 'reload':
        imageRef = "NSRefreshTemplate";
        break;
      case 'reveal':
        imageRef = "NSRevealFreestandingTemplate";
        break;
      case 'forward-inverse':
        imageRef = "NSFollowLinkFreestandingTemplate";
        break;
      case 'back-inverse':
        imageRef = "NSInvalidDataFreestandingTemplate";
        break;
      case 'stop-inverse':
        imageRef = "NSStopProgressFreestandingTemplate";
        break;
      case 'reload-inverse':
        imageRef = "NSRefreshFreestandingTemplate";
        break;
      case 'network':
        imageRef = "NSNetwork";
        break;
      case 'computer':
        imageRef = "NSComputer";
        break;
      case 'folder':
        imageRef = "NSFolder";
        break;
      //case 'folder-burnable':
      //  imageRef = "NSFolderBurnable";
      //  break;
      //case 'folder-smart':
      //  imageRef = "NSFolderSmart";
      //  break;
      case 'advanced':
        imageRef = "NSAdvanced";
        break;
      case 'general':
        imageRef = "NSPreferencesGeneral";
        break;
      case 'accounts':
        imageRef = "NSUserAccounts";
        break;
      case 'info':
        imageRef = "NSInfo";
        break;
      case 'fonts':
        imageRef = "NSFontPanel";
        break;
      case 'colors':
        imageRef = "NSColorPanel";
        break;
      case 'user':
        imageRef = "NSUser";
        break;
      case 'group':
        imageRef = "NSUserGroup";
        break;
      case 'everyone':
        imageRef = "NSEveryone";
        break;
      case 'look':
        imageRef = "NSQuickLookTemplate";
        break;
      case 'trash':
        imageRef = "NSTrashEmpty";
        break;
      case 'trash-full':
        imageRef = "NSTrashFull";
        break;
      case 'bookmarks':
        imageRef = "NSBookmarksTemplate";
        break;
      case 'caution':
        imageRef = "NSCaution";
        break;
      case 'status-available':
        imageRef = "NSStatusAvailable";
        break;
      case 'status-partially-available':
        imageRef = "NSStatusPartiallyAvailable";
        break;
      case 'status-unavailable':
        imageRef = "NSStatusUnavailable";
        break;
      case 'status-none':
        imageRef = "NSStatusNone";
        break;
      case 'home':
        imageRef = "NSHomeTemplate";
        break;
      case 'application':
        imageRef = "NSApplicationIcon";
        break;
      case 'bluetooth':
        imageRef = "NSBluetoothTemplate";
        break;
      default:
      break;
    }
    return imageRef;
  }

  function makeNSImage(e) {
    var img = null;
    if(!e || typeof(e) !== 'string') {
      return null;
    } else if(e.indexOf(':') > -1) {
      img = $.NSImage('alloc')('initWithContentsOfURL',$.NSURL('URLWithString',$(e)));
    } else if (e.indexOf('/') > -1 || e.indexOf('.') > -1) {
      if(e[0] !== '/' && process.mainModule) {
        img = $.NSImage('alloc')('initWithContentsOfFile',$(path.join(path.dirname(process.mainModule.filename),e)));
      } else {
        img = $.NSImage('alloc')('initWithContentsOfFile',$(e));
      }
      
    } else {
      var imageRef = getImageFromString(e);
      if(imageRef === null) {
        img = null;
      } else {
        img = $.NSImage('imageNamed',$(imageRef));
      }
    }
    return img;
  }

  function makeURIFromNSImage(nsimage) {
    var cgimage = nsimage('CGImageForProposedRect',null,'context',$.NSGraphicsContext('currentContext'),'hints',null);
    var bitmapRep = $.NSBitmapImageRep('alloc')('initWithCGImage',cgimage);
    var imageData = bitmapRep('representationUsingType',$.NSPNGFileType, 'properties', null);
    var base64String = imageData('base64EncodedStringWithOptions',0);
    return "data:image/png;base64," + base64String;
  }

  function makePropertyBoolType(obj,name,getselector,setselector,options) {
    Object.defineProperty(obj, name, {
      configurable:true,
      enumerable:true,
      get:function() {
        if(options && options.inverse) {
          return this.native(getselector) === $.NO ? true : false;
        } else {
          return this.native(getselector) ? true : false;
        }
      },
      set:function(value) {
        if(options && options.inverse) {
          this.native(setselector, value ? $.NO : $.YES);
        } else {
          this.native(setselector, value ? $.YES : $.NO);
        }
        if(options && options.display) {
          this.nativeView('setNeedsDisplay', $.YES);
        }
      }
    });
  }

  function makePropertyStringType(obj,name,getselector,setselector) {
    Object.defineProperty(obj, name, {
      configurable:true,
      enumerable:true,
      get:function() { return this.native(getselector)('UTF8String'); },
      set:function(value) { this.native(setselector, $(value ? value.toString() : "")); }
    });
  }

  function makePropertyNumberType(obj,name,getselector,setselector) {
    Object.defineProperty(obj, name, {
      configurable:true,
      enumerable:true,
      get:function() { return this.native(getselector); },
      set:function(value) { this.native(setselector, value ? value : 0); }
    });
  }

  function makePropertyMapType(obj,name,getselector,setselector,map) {
    Object.defineProperty(obj, name, {
      configurable:true,
      enumerable:true,
      get:function() { 
        var val = this.native(getselector);
        for(var key in map) {
          if(map.hasOwnProperty(key) && map[key] === val) {
            return key;
          }
        }
        return null;
      },
      set:function(value) {
        assert.ok(map.hasOwnProperty(value), "["+value+"] is not a valid value for "+name+" property.");
        var mappedValue = map[value];
        this.native(setselector, mappedValue); 
      }
    });
  }

  function makePropertyImageType(obj,name,getselector,setselector) {
    Object.defineProperty(obj, name, {
      configurable:true,
      enumerable:true,
      get:function() { return this.private['_'+name]; },
      set:function(e) {
        this.private['_'+name] = e;
        if(e) {
          e = makeNSImage(e);
        }
        this.nativeView(setselector, e ? e : null);
      }
    });
  }

  function makePropertyColorType(obj,name,getselector,setselector) {
    Object.defineProperty(obj, name, {
      configurable:true,
      enumerable:true,
      get:function() { 
        var Color = require('Color');
        return (new Color(this.private['_'+name])); 
      },
      set:function(e) {
        var Color = require('Color');
        this.private['_'+name] = e;
        this.nativeView(setselector, e ? ((new Color(e)).native) : null);
      }
    });
  }

  function makePropertyFontType(obj,name,getselector,setselector) {
    Object.defineProperty(obj, name, {
      configurable:true,
      enumerable:true,
      get:function() { 
        var Font = require('Font');
        return (new Font(this.private['_'+name])); 
      },
      set:function(e) {
        var Font = require('Font');
        this.private['_'+name] = e;
        this.nativeView(setselector, e ? ((new Font(e)).native) : null);
      }
    });
  }

  baseUtilities.getImageFromString = getImageFromString;
  baseUtilities.nsDictionaryToObject = nsDictionaryToObject;
  baseUtilities.nsArrayToArray = nsArrayToArray;
  baseUtilities.makePropertyBoolType = makePropertyBoolType;
  baseUtilities.makePropertyStringType = makePropertyStringType;
  baseUtilities.makePropertyImageType = makePropertyImageType;
  baseUtilities.makePropertyMapType = makePropertyMapType;
  baseUtilities.makeNSImage = makeNSImage;
  baseUtilities.arrayToNSArray = arrayToNSArray;
  baseUtilities.makeURIFromNSImage = makeURIFromNSImage;
  baseUtilities.makePropertyColorType = makePropertyColorType;
  baseUtilities.makePropertyFontType = makePropertyFontType;
  baseUtilities.makePropertyNumberType = makePropertyNumberType;

  global.__TINT.Utilities = baseUtilities;
  return baseUtilities;
})();

