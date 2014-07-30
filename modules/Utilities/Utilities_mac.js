module.exports = (function() { 
  var baseUtilities = require('./Utilities_base');

  function attachSizeProperties($nativeObj, target, fireEvent, options) {
      var _width = 20, _height = 20, _minWidth = 20, _maxWidth = 20, _minHeight = 20, _maxHeight = 20;
      if(!options) options = {};

      if(options.maxWidth) _maxWidth = options.maxWidth;
      if(options.minWidth) _minWidth = options.minWidth;
      if(options.minHeight) _minHeight = options.minHeight;
      if(options.maxHeight) _maxHeight = options.maxHeight;
      if(options.width) _width = options.width;
      if(options.height) _height = options.height;

      // NO IDEA WHY BUT SETTING THE MAX HEIGHT AND WIDTH
      // OF ANY OBJECT SOMEHOW CORRUPTS THE VALUES OF SUBVIEW'S
      // THAT TRY AND SET THE HEIGHT/WIDTH.
      Object.defineProperty(target, 'heightMinimum', {
        get:function() { return _minHeight; }.bind(this),
        set:function(e) { 
          _minHeight = e;
          if(options.hasmaxmin)
          {
            var _size = $nativeObj('minSize');
            _size.width = _minWidth;
            _size.height = _minHeight;
            if(options.type == "window")
              $nativeObj('setContentMinSize',_size);
            else
              $nativeObj('setMinSize',_size);
          }
          fireEvent('boundschange');
        }.bind(this)
      });

      Object.defineProperty(target, 'heightMaximum', {
        get:function() { return _maxHeight; },
        set:function(e) { 
          _maxHeight = e;
          if(options.hasmaxmin)
          {
            var _size = $nativeObj('maxSize');
            _size.width = _maxWidth;
            _size.height = _maxHeight;
            if(options.type == "window")
              $nativeObj('setContentMaxSize',_size);
            else
              $nativeObj('setMaxSize',_size);
          }
          fireEvent('boundschange');
        }.bind(this)
      });

      Object.defineProperty(target, 'widthMinimum', {
        get:function() { return _minWidth; },
        set:function(e) { 
          _minWidth = e;
          if(options.hasmaxmin) {
            var _size = $nativeObj('minSize');
            _size.width = _minWidth;
            _size.height = _minHeight;
            if(options.type == "window")
              $nativeObj('setContentMinSize',_size);
            else
              $nativeObj('setMinSize',_size);
          }
          fireEvent('boundschange');
        }.bind(this)
      });

      Object.defineProperty(target, 'widthMaximum', {
        get:function() { return _maxWidth; },
        set:function(e) { 
          _maxWidth = e;
          if(options.hasmaxmin)
          {
            var _size = $nativeObj('maxSize');
            _size.width = _maxWidth;
            _size.height = _maxHeight;
            if(options.type == "window")
              $nativeObj('setContentMaxSize',_size);
            else
              $nativeObj('setMaxSize',_size);

          }
          fireEvent('boundschange');
        }.bind(this)
      });

      if(options.hasmaxmin) {
        var maxSize = $.NSMakeSize(_maxWidth,_maxHeight);
        var minSize = $.NSMakeSize(_minWidth,_minHeight);

        if(options.type == "window") 
          $nativeObj('setContentMaxSize', maxSize);
        else
          $nativeObj('setMaxSize', maxSize);
        if(options.type == "window") 
          $nativeObj('setContentMinSize', minSize);
        else
          $nativeObj('setMinSize',minSize);
      }

      Object.defineProperty(target, 'width', {
        get:function() { return _width; }.bind(this),
        set:function(e) { 
          //TODO: If this has not been properly added to a view sometimes width is ignored and
          // we need to simply ignore the width value for the moment (E.g., we've been added to
          // a toolbar that ignores frames and returns invalid numbers if necessary.)
          _width = e;
          var _rect = $nativeObj('frame');
          _rect.size.height = _height;
          _rect.size.width = _width;
          if(options.type == 'window')
            $nativeObj('setFrame', _rect, 'display', true, 'animate', global.application.preferences.animateWhenPossible ? true : false);
          else
            $nativeObj('setFrame', _rect);
        }.bind(this)
      });

      Object.defineProperty(target, 'height', {
        get:function() { return _height; }.bind(this),
        set:function(e) { 
          _height = e;
          var _rect = $nativeObj('frame');
          _rect.size.height = _height;
          _rect.size.width = _width;
          if(options.type == 'window')
            $nativeObj('setFrame', _rect, 'display', true, 'animate', global.application.preferences.animateWhenPossible ? true : false);
          else
            $nativeObj('setFrame', _rect);
        }.bind(this)
      });

      Object.defineProperty(target, 'widthActual', {
        get:function() { 
          return $nativeObj('frame').size.width; 
        }.bind(this)
      });

      Object.defineProperty(target, 'heightActual', {
        get:function() { 
          return $nativeObj('frame').size.height; 
        }.bind(this)
      });

      if(!options.nolayout) {
        function boolToBitMask(apply, val, mask) {
          return apply ? (val | mask ) : (val ^ mask);
        }

        Object.defineProperty(target, 'widthCanResize', {
          get:function() { return $nativeObj('autoresizingMask') & $.NSViewWidthSizable ? true : false; },
          set:function(e) { $nativeObj('setAutoresizingMask', boolToBitMask(e,$nativeObj('autoresizingMask'),$.NSViewWidthSizable)); }
        });

        Object.defineProperty(target, 'heightCanResize', {
          get:function() { return $nativeObj('autoresizingMask') & $.NSViewHeightSizable ? true : false; },
          set:function(e) { $nativeObj('setAutoresizingMask', boolToBitMask(e,$nativeObj('autoresizingMask'),$.NSViewHeightSizable)); }
        });

        Object.defineProperty(target, 'rightMarginCanResize', {
          get:function() { return $nativeObj('autoresizingMask') & $.NSViewMaxXMargin ? true : false; },
          set:function(e) { $nativeObj('setAutoresizingMask', boolToBitMask(e,$nativeObj('autoresizingMask'),$.NSViewMaxXMargin)); }
        });

        Object.defineProperty(target, 'leftMarginCanResize', {
          get:function() { return $nativeObj('autoresizingMask') & $.NSViewMinXMargin ? true : false; },
          set:function(e) { $nativeObj('setAutoresizingMask', boolToBitMask(e,$nativeObj('autoresizingMask'),$.NSViewMinXMargin)); }
        });
        
        Object.defineProperty(target, 'topMarginCanResize', {
          get:function() { return $nativeObj('autoresizingMask') & $.NSViewMaxYMargin ? true : false; },
          set:function(e) { $nativeObj('setAutoresizingMask', boolToBitMask(e,$nativeObj('autoresizingMask'),$.NSViewMaxYMargin)); }
        });

        Object.defineProperty(target, 'bottomMarginCanResize', {
          get:function() { return $nativeObj('autoresizingMask') & $.NSViewMinYMargin ? true : false; },
          set:function(e) { $nativeObj('setAutoresizingMask', boolToBitMask(e,$nativeObj('autoresizingMask'),$.NSViewMinYMargin)); }
        });

        target.autosize = function() { $nativeObj('sizeToFit');  }
      }
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

  return {
    attachSizeProperties:attachSizeProperties,
    getImageFromString:getImageFromString,
    parseColor:baseUtilities.parseColor
  }
})();

