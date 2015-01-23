module.exports = (function() {
  if(global.__TINT.Container) {
    return global.__TINT.Container;
  }
  var Control = require('Control');
  var util = require('Utilities');
  var $ = process.bridge.objc;

  /**
   * @class Container
   * @description A generic standard container for other components, this component allows you to group
   *              elements together in a single nested view. Most components within Tint's framework 
   *              inherit (or use) the functionality of this component as a starting point. This component
   *              is useful when a set of components rely on one another to accomplish a common behavior. 
   *              
   *              For example, a file selection may have both a text input and a button associated with it,
   *              combining the two into a new control using the container is a good way of reusing controls.
   * @extends Control
   */
  function Container(options) {
    this.nativeClass = this.nativeClass || $.NSView;
    this.nativeViewClass = this.nativeViewClass || $.NSView;
    Control.call(this, options);
    this.private.children = [];
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  util.def(Container.prototype, 'children', function() { return this.private.children; });

  /**
   * @method appendChild
   * @memberof Container
   * @param {Control} control A control to add as a child to this control.
   * @description Append child adds the passed in control as a child to this control. 
   * @see removeChild
   */
  /**
   * @method appendChild
   * @memberof Container
   * @param {Array} controls An array of controls that you'd like to add as children to this control.
   * @description Append child adds the passed in array (or several) controls as a children to this control. 
   * @see removeChild
   */
  Container.prototype.appendChild = function(control) {
    if(Array.isArray(control)) {
      for(var i=0; i < control.length; i++) {
        this.appendChild(control[i]);
      }
    } else {
      control = this.fireEvent('before-child-attached', [control]) || control;
      this.private.children.push(control);
      if(control.nativeView && this.nativeView) {
        this.nativeView('addSubview',control.nativeView);
      }
      if(control.fireEvent) {
        control.fireEvent('parent-attached', [this]);
      }
      this.fireEvent('child-attached', [control]);
    }
  };

  /**
   * @method removeChild
   * @memberof Container
   * @param {Control} control The control to remove from this control.
   * @description Remove child removes the passed in control from the list of children controls it has.
   * @see removeChild
   */
  Container.prototype.removeChild = function(control) {
    control = this.fireEvent('before-child-dettached', [control]) || control;
    if(this.private.children.indexOf(control) !== -1) {
      this.private.children.splice(this.private.children.indexOf(control),1);
    }
    if(control.nativeView) {
      control.nativeView('removeFromSuperview');
    }
    if(control.fireEvent) {
      control.fireEvent('parent-dettached', [this]);
    }
    this.fireEvent('child-dettached', [control]);
  };

  //TODO: Remove this? Inconsistant with windows version.
  Container.prototype.scrollTo = function(x, y) {
    var b = this.bounds;
    this.nativeView('scrollPoint', $.NSMakePoint(x,b.height - y));
  };

  global.__TINT.Container = Container;
  return Container;
})();