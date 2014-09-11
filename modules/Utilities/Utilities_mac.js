module.exports = (function() { 
  var baseUtilities = require('Utilities_base');
  var $ = process.bridge.objc;

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
      nsarray('insertObject', $((arr[i].toString())), 'atIndex', i);
    }
    return nsarray;
  }

  function nsDictionaryToObject(nsdictionary) {
    var allKeys = nsdictionary('allKeys');
    var count = allKeys('count');
    var values = []
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
      case 'folder-burnable':
        imageRef = "NSFolderBurnable";
        break;
      case 'folder-smart':
        imageRef = "NSFolderSmart";
        break;
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

  function parseUnits(e) {
    if(typeof e == 'number') return e;
    if(e.indexOf('%') > -1) {
      e = e.replace('%','').trim();
      e = parseInt(e);
      e = e/100;
    } else {
      e = e.replace('px','').trim();
      e = parseInt(e);
    }
    return e;
  }

  function makePropertyBoolType(name,getselector,setselector) {
    Object.defineProperty(this, name, {
      get:function() { return this.native(getselector); },
      set:function(value) { this.native(setselector, value ? true : false); }
    });
  }

  function makePropertyStringType(name,getselector,setselector) {
    Object.defineProperty(this, name, {
      get:function() { return this.native(getselector); },
      set:function(value) { this.native(setselector, $(value ? value : "")); }
    });
  }

  function makeNSImage(e) {
    var img = null;
    if(!e || typeof(e) !== 'string') return null;
    else if(e.indexOf(':') > -1)
      img = $.NSImage('alloc')('initWithContentsOfURL',$.NSURL('URLWithString',$(e)));
    else if (e.indexOf('/') > -1 || e.indexOf('.') > -1)
      img = $.NSImage('alloc')('initWithContentsOfFile',$(e));
    else {
      var imageRef = getImageFromString(e);
      if(imageRef==null) img = null;
      else img = $.NSImage('imageNamed',$(imageRef));
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

  function errorwrap(func) {
    var wrap = function() {
      try {
        return func.apply(null,arguments);
      } catch(e) {
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
      }
    }
    return wrap;
  }

  return {
    //attachSizeProperties:attachSizeProperties,
    getImageFromString:getImageFromString,
    parseColor:baseUtilities.parseColor,
    nsDictionaryToObject:nsDictionaryToObject,
    nsArrayToArray:nsArrayToArray,
    parseUnits:parseUnits,
    makePropertyBoolType:makePropertyBoolType,
    makePropertyStringType:makePropertyStringType,
    makeNSImage:makeNSImage,
    errorwrap:errorwrap,
    arrayToNSArray:arrayToNSArray,
    makeURIFromNSImage:makeURIFromNSImage
  }
})();

