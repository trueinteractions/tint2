module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  function Split(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['splitView:canCollapseSubview:','B@:@@', function(self, selector, splitview, subview) { return $.NO; }.bind(this)],
      ['splitView:constrainMaxCoordinate:ofSubviewAt:','d@:@dl', function(self, selector, splitview, proposedMax, index) { return proposedMax; }.bind(this)],
      ['splitView:constrainMinCoordinate:ofSubviewAt:','d@:@dl', function(self, selector, splitview, proposedMin, index) { return proposedMin; }.bind(this)],
      ['splitView:constrainSplitPosition:ofSubviewAt:','d@:@dl', function(self, selector, splitview, proposedPosition, index) { return proposedPosition; }.bind(this)],
      ['splitView:shouldAdjustSizeOfSubview:','B@:@@', function(self, selector, splitview, subview) { return $.YES; }.bind(this)],
      ['splitView:shouldHideDividerAtIndex:','B@:@l', function(self, selector, splitview, index) { return $.YES; }.bind(this)],
      ['splitViewDidResizeSubviews:','v@:@', function(self, selector, notif) { this.fireEvent('resized'); }.bind(this)],
      ['splitViewWillResizeSubviews:','v@:@', function(self, selector, notif) { this.fireEvent('resize'); }.bind(this)]
    ]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSSplitView, $.NSSplitView, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);

    this.private.backupAppend = Container.prototype.appendChild;
    this.private.backupRemove = Container.prototype.removeChild;
    this.private.lockedSubviewIndexes = [];

    this.native('setDelegate', this.nativeView);
    this.nativeView('setVertical',$.YES);
    this.nativeView('setDividerStyle', $.NSSplitViewDividerStyleThin);
  }

  Split.prototype = Object.create(Container.prototype);
  Split.prototype.constructor = Split;

  Split.prototype.appendChild = function() { 
    this.private.backupAppend.apply(this,arguments);
    this.nativeView('adjustSubviews');
  }

  Split.prototype.removeChild = function() { 
    this.private.backupRemove.apply(this,arguments);
    this.nativeView('adjustSubviews'); 
  }

  Split.prototype.setPosition = function(position, index) {
    position = position > 1 ? 1 : position;
    position = position < 0 ? 0 : position;

    // Give this a small timeout, if the view has not gone through a event
    // loop pass it will not be properly set.
    setTimeout(function() {
      var div;
      if(this.nativeView('isVertical'))
        div = this.bounds.width;
      else
        div = this.bounds.height;
      position = position * div;
      this.nativeView('setPosition', position, 'ofDividerAtIndex', index);
    }.bind(this),100);
  }

  Object.defineProperty(Split.prototype, 'orientation', {
    get:function() { return this.nativeView('isVertical') ? "vertical" : "horizontal"; },
    set:function(e) { this.nativeView('setVertical', e == "vertical" ? $.YES : $.NO); }
  });

  Object.defineProperty(Split.prototype, 'style', {
    get:function() {
      var s = this.nativeView('dividerStyle');
      if(s == $.NSSplitViewDividerStyleThick) return "thick";
      else if (s == $.NSSplitViewDividerStyleThin) return "thin";
      else if (s == $.NSSplitViewDividerStylePaneSplitter) return "pane";
      else return "unknown";
    },
    set:function(e) { 
      if(e == "thick") this.nativeView('setDividerStyle', $.NSSplitViewDividerStyleThick);
      else if (e == "thin") this.nativeView('setDividerStyle', $.NSSplitViewDividerStyleThin);
      else if (e == "pane") this.nativeView('setDividerStyle', $.NSSplitViewDividerStylePaneSplitter);
    }
  });

  return Split;

})();
