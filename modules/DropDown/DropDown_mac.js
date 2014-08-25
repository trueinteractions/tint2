module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  function DropDown(options) {
    var menu = null;
    Container.call(this, $.NSPopUpButton, $.NSPopUpButton, {mouseDownBlocks:true,keyDownBlocks:true});
    this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame', $.NSMakeRect(0,0,200,20), 'pullsDown', false);
    this.native('setTranslatesAutoresizingMaskIntoConstraints', $.NO);

    Object.defineProperty(this, 'title', {
      get:function() { return this.native('title') },
      set:function(e) { return this.native('setTitle', $(e)); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return this.native('isEnabled'); },
      set:function(e) { return this.native('setEnabled', e); }
    });

    Object.defineProperty(this, 'options', {
      get:function() { return menu; },
      set:function(e) {
        menu = e;
        this.native('setMenu',menu.native);
      }
    });

    Object.defineProperty(this, 'selectedIndex', {
      get:function() { return this.nativeView('indexOfSelectedItem'); },
      set:function(e) { this.nativeView('selectItemAtIndex', e); }
    });

  }
  DropDown.prototype = Object.create(Container.prototype);
  DropDown.prototype.constructor = DropDown;

  return DropDown;
})();