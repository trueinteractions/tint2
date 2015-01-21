module.exports = (function() {
  var util = require('Utilities');
  var Container = require('Container');
  var ToolbarItem = require('ToolbarItem');
  var $ = process.bridge.objc;
  /**
   * @class Toolbar
   * @description The toolbar is a strip applied to the top of a window allowing elements to be
   *              added and customized per the user preferences. Note that items in the toolbar 
   *              are not guaranteed to show depending on how the user decides to remove/add items.
   *              A toolbar can be assigned to a window using Window.toolbar.
   * @extends Control
   * @see Window
   */
  /**
   * @new 
   * @memberof Toolbar
   * @description Creates a new toolbar.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var urlLocation = new TextInput();
   * var toolbar = new Toolbar();
   * var backButton = new Button();
   * var forwardButton = new Button();
   * 
   * backButton.image = 'back'; // named system icon
   * forwardButton.image = 'forward'; // named system icon
   *
   * // Use 'space' for a OS-determined variable length space between items.
   * toolbar.appendChild([backButton, forwardButton, 'space', urlLocation, 'space']);
   * win.toolbar = toolbar;
   * 
   * urlLocation.alignment = 'center';
   * urlLocation.linewrap = false;
   * urlLocation.scrollable = true;
   * urlLocation.value = 'A text input field';
   * @screenshot-window {win}
   */

  function makeNSToolbarItemFromNSView(size,identifier,child) {
    var toolbarItem = $.NSToolbarItem('alloc')('initWithItemIdentifier',$(identifier.toString()));
    // This is necessary, even though it would seem we're adding toolbar items with fixed height/width Auto Layout
    // actually still applies.  Without this rendering is undefined, so setting the translation of autoresizing
    // masks is necessary.
    child.native('setTranslatesAutoresizingMaskIntoConstraints',$.YES);

    var intrinsicSize = child.native('intrinsicContentSize');
    
    if(child.native.toString().indexOf("NSButton") > -1) {
      if(size === "small") {
        intrinsicSize.height = 24;
      } else {
        intrinsicSize.height = 32;
      }
      intrinsicSize.width = intrinsicSize.height;
    }
    if(child.native.toString().indexOf("NSText") > -1) {
      toolbarItem('setMaxSize', $.NSMakeSize(1000,intrinsicSize.height));
      toolbarItem('setMinSize', intrinsicSize);
    } else {
      toolbarItem('setMaxSize', intrinsicSize);
      toolbarItem('setMinSize', intrinsicSize);
    }
    toolbarItem('setView',child.native);
    return toolbarItem;
  }

  function Toolbar() {
    var toolbarCache = [];
    this.native = $.NSToolbar('alloc')('initWithIdentifier',$(application.name));
    this.native('setAllowsUserCustomization',$.NO);
    this.native('setAutosavesConfiguration',$.NO);
    this.native('setDisplayMode',$.NSToolbarDisplayModeIconOnly);
    this.native('setSizeMode',$.NSToolbarSizeModeSmall);

    this.private = {children:[], identifiers:{}};
    this.private.getChildren = function() {
      var nsArrayChildren = $.NSMutableArray('alloc')('init');
      this.private.children.forEach(function(item) {
        nsArrayChildren('addObject',$(item.private.identifier));
      });
      return nsArrayChildren;
    }

    var $NSToolbarDelegateClass = $.NSObject.extend('ToolbarDelegate'+Math.round(Math.random()*10000));
    $NSToolbarDelegateClass.addMethod('init:','@@:', function(self) { return self; });
    $NSToolbarDelegateClass.addMethod('toolbarAllowedItemIdentifiers:','@@:', this.private.getChildren.bind(this));
    $NSToolbarDelegateClass.addMethod('toolbarDefaultItemIdentifiers:','@@:', this.private.getChildren.bind(this));
    $NSToolbarDelegateClass.addMethod('toolbar:itemForItemIdentifier:willBeInsertedIntoToolbar:','@@:@@B', function(self, cmd, toolbar, identifier) {
        if(!toolbarCache[identifier]) {
          var child = this.private.identifiers[identifier];
          var toolbarItem = child.native;
          if(!(child instanceof ToolbarItem)) {
            toolbarItem = makeNSToolbarItemFromNSView(this.size, identifier, child);
          }
          toolbarCache[identifier] = toolbarItem;
        }
        return toolbarCache[identifier];
    }.bind(this));

    $NSToolbarDelegateClass.register();
    var $NSToolbarDelegateInstance = $NSToolbarDelegateClass('alloc')('init');
    this.native('setDelegate',$NSToolbarDelegateInstance);

    this.addEventListener('before-child-attached', function(child) {
      if(child === "space") {
        child = { native:$("NSToolbarFlexibleSpaceItem"), private:{identifier:"NSToolbarFlexibleSpaceItem"} };
      }
      if (!child.private.identifier) {
        child.private.identifier = (this.private.children.length+1).toString();
      }
      this.private.identifiers[child.private.identifier] = child;
      this.native('insertItemWithItemIdentifier', $(child.private.identifier), 'atIndex', this.private.children.length);
      return child;
    }.bind(this));

    this.addEventListener('before-child-dettached', function(child) {
      this.native('removeItemAtIndex', this.private.children.indexOf(child));
      delete this.private.identifiers[child.private.identifier];
      delete toolbarCache[child.private.identifier]
    }.bind(this));
  } 

  util.defEvents(Toolbar.prototype);
  util.def(Toolbar.prototype, 'children', function() { return this.private.children; });

  /**
   * @method appendChild
   * @param {child} The control to append to the toolbar control.
   * @memberof Toolbar
   * @description appendChild adds a new control to the toolbar.
   */
  Toolbar.prototype.appendChild = Container.prototype.appendChild;
  
  /**
   * @method removeChild
   * @param {child} The control to remove from the toolbar.
   * @memberof Toolbar
   * @description removeChild removes a control from the toolbar.
   */
  Toolbar.prototype.removeChild = Container.prototype.removeChild;

  /**
   * @member state
   * @type {string}
   * @memberof Toolbar
   * @description Gets or sets the style of the toolbar, the values can be "iconandlabel", "icon"
   *              "default" or "label".
   */
  util.makePropertyMapType(Toolbar.prototype, 'state', 'displayMode', 'setDisplayMode', {
    iconandlabel:$.NSToolbarDisplayModeIconAndLabel,
    icon:$.NSToolbarDisplayModeIconOnly,
    label:$.NSToolbarDisplayModeLabelOnly,
    default:$.NSToolbarDisplayModeDefault
  });

  /**
   * @member size
   * @type {string}
   * @memberof Toolbar
   * @description Gets or sets the size of the toolbar based on OS recommended values. 
   *              The values for this can be "regular", "small" or "default".
   */

  util.makePropertyMapType(Toolbar.prototype, 'size', 'sizeMode', 'setSizeMode', {
    regular:$.NSToolbarSizeModeRegular,
    small:$.NSToolbarSizeModeSmall,
    default:$.NSToolbarSizeModeDefault
  });
  return Toolbar;
})();