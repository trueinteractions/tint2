module.exports = (function() {
  var Button = require('Button');
  var $ = process.bridge.objc;

  function DropDown() {
    Button.call(this, $.NSPopUpButton, $.NSPopUpButton, {mouseDownBlocks:true,keyDownBlocks:true});
    this.private.menu = null;
  }

  DropDown.prototype = Object.create(Button.prototype);
  DropDown.prototype.constructor = DropDown;

  Object.defineProperty(DropDown.prototype, 'pullsdown', {
    get:function() { return this.nativeView('pullsDown') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setPullsDown', e ? $.YES : $.NO); }
  })

  Object.defineProperty(DropDown.prototype, 'options', {
    get:function() { return this.private.menu; },
    set:function(e) {
      this.private.menu = e;
      this.native('setMenu',this.private.menu.native);
    }
  });

  Object.defineProperty(DropDown.prototype, 'selectedIndex', {
    get:function() { return this.nativeView('indexOfSelectedItem'); },
    set:function(e) { this.nativeView('selectItemAtIndex', e); }
  });

  return DropDown;
})();