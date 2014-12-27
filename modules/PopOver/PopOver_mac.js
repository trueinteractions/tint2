module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.objc;

  function PopOver(options) {
    var options = options || {};
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['popoverDidClose:', 'v@:@@', function(self, cmd, notif) { this.fireEvent('close'); }.bind(this)],
      ['popoverDidShow:', 'v@:@@', function(self, cmd, notif) { this.fireEvent('opened'); }.bind(this)],
      ['popoverWillShow:', 'v@:@@', function(self, cmd, notif) { this.fireEvent('open'); }.bind(this)],
    ]);
    this.nativeClass = this.nativeClass || $.NSPopover;
    this.nativeViewClass = this.nativeViewClass || $.NSView;
    Container.call(this, options);
    
    this.native('retain');
    this.nativeView('retain');
    this.native('setBehavior', $.NSPopoverBehaviorSemitransient);
    this.native('setAppearance', $.NSPopoverAppearanceMinimal);
    this.native('setAnimates', $.YES);

    this.private.open = false;
    this.private.opening = true;

    this.native('setDelegate', this.nativeView);

    var PopOverControllerClass = $.NSViewController.extend('PopOverControllerClass'+Math.round(Math.random()*10000));
    PopOverControllerClass.addMethod('loadView','v@:', function(self,cmd) { self('setView',this.nativeView); }.bind(this));
    PopOverControllerClass.register();
    var popOverControllerInstance = PopOverControllerClass('alloc')('initWithNibName',null,'bundle',null);

    this.native('setContentViewController', popOverControllerInstance);
  }

  PopOver.prototype = Object.create(Container.prototype);
  PopOver.prototype.constructor = PopOver;

  Object.defineProperty(PopOver.prototype, 'width', {
    get:function() { return this.native('contentSize').width; },
    set:function(e) {
      if(!this.private.open) { this.addEventListener('open', function() { this.private.open = true; this.width = e; }.bind(this)); }
      else {
        var rect = this.native('contentSize');
        rect.width = e;
        this.native('setContentSize', rect);
      }
    }
  });

  Object.defineProperty(PopOver.prototype, 'height', {
    get:function() { return this.native('contentSize').height; },
    set:function(e) {
      if(!this.private.open) { this.addEventListener('open', function() { this.private.open = true; this.height = e; }.bind(this)); }
      else {
        var rect = this.native('contentSize');
        rect.height = e;
        this.native('setContentSize', rect);
      }
    }
  });

  PopOver.prototype.open = function(container, side) {
    var edge = side == 'left' ? $.NSMinXEdge : side == 'right' ? $.NSMaxXEdge : side == 'top' ? $.NSMinYEdge : $.NSMaxYEdge;
    // The timeout is necessary, popover will not show if the view
    // has yet to complete its layout, give it a tick to calculate.
    setTimeout(function() {
      this.native('showRelativeToRect', $.NSMakeRect(0,0,0,0), 'ofView', container.nativeView, 'preferredEdge', edge);
    }.bind(this), 100);
  }

  PopOver.prototype.close = function() {
    this.native('performClose',this.native);
  }

  return PopOver;

})();
