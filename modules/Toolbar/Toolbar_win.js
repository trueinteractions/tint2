module.exports = (function() {
  var Control = require('Control');
  var $ = process.bridge.dotnet;

  function Toolbar() {
    //var $toolbar = $.NSToolbar('alloc')('initWithIdentifier',$(application.name));
    var children = [];
    var toolbarCache = [];

    //$toolbar('setAllowsUserCustomization',$.NO);
    //$toolbar('setAutosavesConfiguration',$.NO);
    //$toolbar('setDisplayMode',$.NSToolbarDisplayModeIconOnly);
    //$toolbar('setSizeMode',$.NSToolbarSizeModeSmall);


    Object.defineProperty(this, 'state', {
      get:function() { 
        // iconandlabel
        // icon
        // label

      },
      set:function(e) {

      }
    });

    Object.defineProperty(this, 'size', {
      get:function() { 
      },
      set:function(e) {

      }
    });

    this.appendChild = function(child) {
      //TODO: Ensure all append childs work like this.
      if(Array.isArray(child)) {
        for(var i=0; i < child.length; i++) this.appendChild(child[i]);
      } else {
        //
      }
    }

    this.removeChild = function(child) {
      var index = children.indexOf(child);
      if(index != -1) {
        children.splice(index,1);
        //
      }
    }

    Object.defineProperty(this, 'native', { get:function() { return $toolbar; }});
  } 

  return Toolbar;
})();