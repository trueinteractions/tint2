module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  function Split(options) {
    Container.call(this, $.NSSplitView, $.NSSplitView, {});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);

    var backupAppend = this.appendChild;
    var backupRemove = this.removeChild;

    this.appendChild = function() { 
      backupAppend.apply(this,arguments);
      this.nativeView('adjustSubviews');
    }.bind(this);
    this.removeChild = function() { 
      backupRemove.apply(this,arguments);
      this.nativeView('adjustSubviews'); 
    }.bind(this);

    this.setDividerAt = function(position, index) {
      this.nativeView('setPosition', position, 'ofDividerAtIndex', index);
    }
  }

  Split.prototype = Object.create(Container.prototype);
  Split.prototype.constructor = Split;

  return Split;
})();
