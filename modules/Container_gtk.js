module.exports = (function() {
  if(global.__TINT.Container) {
    return global.__TINT.Container;
  }
  var Control = require('Control');
  var assert = require('assert');
  var util = require('Utilities');
  var $ = process.bridge.gobj.Gtk;

  function Container(options) {
    this.nativeClass = this.nativeClass || $.Container;
    this.nativeViewClass = this.nativeViewClass || $.Container;
    Control.call(this, options);
    this.private.children = [];
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  util.def(Container.prototype, 'children', function() { return this.private.children; });

  Container.prototype.appendChild = function(control) {
    if(this === control) {
      throw new Error('A control cannot be added as a child to itself.');
    }
    if(Array.isArray(control)) {
      for(var i=0; i < control.length; i++) {
        this.appendChild(control[i]);
      }
    } else {
      control = this.fireEvent('before-child-attached', [control]) || control;
      this.private.children.push(control);
      if(control.nativeView && this.nativeView) {
        this.nativeView.add(control.nativeView);
      }
      if(control.fireEvent) {
        control.fireEvent('parent-attached', [this]);
      }
      this.fireEvent('child-attached', [control]);
    }
  };

  Container.prototype.appendChildAt = function(control, ndx) {
    assert(ndx < this.children.length, 'The index specified was out of bounds (e.g., was way too large or small).');
    var atControl = this.children[ndx];
    if(this === control) {
      throw new Error('A control cannot be added as a child to itself.');
    }
    control = this.fireEvent('before-child-attached', [control]) || control;
    this.private.children.splice(ndx, 0, control);
    if(control.nativeView && this.nativeView) {
      //this.nativeView('addSubview', control.nativeView, 'positioned', $.NSWindowAbove, 'relativeTo', atControl.nativeView);
    }
    if(control.fireEvent) {
      control.fireEvent('parent-attached', [this]);
    }
    this.fireEvent('child-attached', [control]);
  };

  Container.prototype.removeChild = function(control) {
    control = this.fireEvent('before-child-dettached', [control]) || control;
    if(this.private.children.indexOf(control) !== -1) {
      this.private.children.splice(this.private.children.indexOf(control),1);
    }
    if(control.nativeView) {
      this.nativeView.remove(control.nativeView);
    }
    if(control.fireEvent) {
      control.fireEvent('parent-dettached', [this]);
    }
    this.fireEvent('child-dettached', [control]);
  };

  //TODO: Remove this? Inconsistant with windows version.
  Container.prototype.scrollTo = function(x, y) {
    var b = this.bounds;
    //this.nativeView('scrollPoint', $.NSMakePoint(x,b.height - y));
  };

  global.__TINT.Container = Container;
  return Container;
})();
