module.exports = (function() {
  var Control = require('Control');

  function Toolbar() {
    var $ = process.bridge.objc;
    var $toolbar = $.NSToolbar('alloc')('initWithIdentifier',$(application.name));
    var children = [];
    var toolbarCache = [];

    $toolbar('setAllowsUserCustomization',$.NO);
    $toolbar('setAutosavesConfiguration',$.NO);
    $toolbar('setDisplayMode',$.NSToolbarDisplayModeIconOnly);
    $toolbar('setSizeMode',$.NSToolbarSizeModeSmall);

    var $NSToolbarDelegateClass = $.NSObject.extend('ToolbarDelegate'+Math.round(Math.random()*10000));
    $NSToolbarDelegateClass.addMethod('init:','@@:', function(self) { return self; });
    $NSToolbarDelegateClass.addMethod('toolbarAllowedItemIdentifiers:','@@:', function(toolbar) {
      try {
        var $NSArrayChildren = $.NSMutableArray('alloc')('init');
        //TODO: RELEASE NSArrayChildren ?
        children.forEach(function(item,index,arr) {
          $NSArrayChildren('addObject',item.identifier);
        });
        return $NSArrayChildren;
      } catch(e) {
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
      }
    });
    $NSToolbarDelegateClass.addMethod('toolbarDefaultItemIdentifiers:','@@:', function(toolbar) {
      try { 
        var $NSArrayChildren = $.NSMutableArray('alloc')('init');
        //TODO: RELEASE NSArrayChildren ?
        children.forEach(function(item,index,arr) {
          $NSArrayChildren('addObject',item.identifier);
        });
        return $NSArrayChildren;
      } catch(e) {
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
      }
    });
    $NSToolbarDelegateClass.addMethod('toolbar:itemForItemIdentifier:willBeInsertedIntoToolbar:','@@:@@B', function(self, cmd, toolbar, identifier, willBeInserted) {
      try {
        if(!toolbarCache[parseInt(identifier)]) {
          var toolbarItem = $.NSToolbarItem('alloc')('initWithItemIdentifier',identifier);
          var child = children[parseInt(identifier)-1];

          var intrinsicSize = child.native('intrinsicContentSize');
          if(intrinsicSize.width == -1 && intrinsicSize.height > 0)
            toolbarItem('setMaxSize', $.NSMakeSize(10000,intrinsicSize.height));
          if(intrinsicSize.height == -1 && intrinsicSize.width > 0)
            toolbarItem('setMaxSize', $.NSMakeSize(intrinsicSize.height,10000));

          toolbarItem('setMinSize', intrinsicSize);
          toolbarItem('setView',child.native);
          toolbarCache[parseInt(identifier)] = toolbarItem;
        }
        return toolbarCache[parseInt(identifier)];
      } catch(e) {
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
      }
    });

    $NSToolbarDelegateClass.register();
    var $NSToolbarDelegateInstance = $NSToolbarDelegateClass('alloc')('init');
    $toolbar('setDelegate',$NSToolbarDelegateInstance);

    Object.defineProperty(this, 'state', {
      get:function() { 
        if($toolbar('displayMode') == $.NSToolbarDisplayModeIconAndLabel) 
          return "iconandlabel";
        else if ($toolbar('displayMode') == $.NSToolbarDisplayModeIconOnly)
          return "icon";
        else if ($toolbar('displayMode') == $.NSToolbarDisplayModeLabelOnly)
          return "label";
        else
          return "default";
      },
      set:function(e) {
        switch(e) {
          case 'iconandlabel':
          $toolbar('setDisplayMode',$.NSToolbarDisplayModeIconAndLabel);
          break;
          case 'icon':
          $toolbar('setDisplayMode',$.NSToolbarDisplayModeIconOnly);
          break;
          case 'label':
          $toolbar('setDisplayMode',$.NSToolbarDisplayModeLabelOnly);
          break;
          default:
          $toolbar('setDisplayMode',$.NSToolbarDisplayModeDefault);
          break;
        }
      }
    });

    Object.defineProperty(this, 'size', {
      get:function() { 
        if($toolbar('sizeMode') == $.NSToolbarSizeModeRegular) 
          return "regular";
        else if ($toolbar('sizeMode') == $.NSToolbarSizeModeSmall)
          return "small";
        else 
          return "default";
      },
      set:function(e) {
        switch(e) {
          case 'regular':
          $toolbar('setSizeMode',$.NSToolbarSizeModeRegular);
          break;
          case 'small':
          $toolbar('setSizeMode',$.NSToolbarSizeModeSmall);
          break;
          default:
          $toolbar('setSizeMode',$.NSToolbarDisplayModeLabelOnly);
          break;
        }
      }
    });

    this.appendChild = function(child) {
      if(Array.isArray(child)) {
        for(var i=0; i < child.length; i++) this.appendChild(child[i]);
      } else {
        var identifier;
        if(child == "space") child = {native:$("NSToolbarFlexibleSpaceItem"), identifier:$("NSToolbarFlexibleSpaceItem")};
        else if (!(child instanceof Control)) 
          throw new Error('The passed in object to append as a child wasnt a control. ['+child+']');
        else child.identifier = $((children.length+1).toString());
        children.push(child);
        $toolbar('insertItemWithItemIdentifier',child.identifier,'atIndex',children.length-1);
      }
    }

    this.removeChild = function(child) {
      var index = children.indexOf(child);
      if(index != -1) {
        children.splice(index,1);
        $toolbar('removeItemAtIndex',index);
      }
    }

    Object.defineProperty(this, 'native', { get:function() { return $toolbar; }});
  } 

  return Toolbar;
})();