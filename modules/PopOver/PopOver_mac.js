module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');

  function PopOver() {
    var open = false, opening = true;
    Container.call(this, $.NSPopover, $.NSView, {});
    this.native = $.NSPopover('alloc')('init');
    var MyViewClass = $.NSView.extend('MyView'+Math.round(Math.random()*10000));
    this.nativeView = MyViewClass('alloc')('init');

    this.native('setBehavior', $.NSPopoverBehaviorSemitransient);
    this.native('setAppearance', $.NSPopoverAppearanceMinimal);
    this.native('setAnimates', $.YES);

    var PopOverDelegateClass = $.NSObject.extend('PopOverDelegate'+Math.round(Math.random()*10000));
    PopOverDelegateClass.addMethod('init', '@@:', function(self) { return self; }.bind(this));
    PopOverDelegateClass.addMethod('popoverDidClose:', 'v@:@@', function(self, cmd, notif) {
      try {
        this.fireEvent('close');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    PopOverDelegateClass.addMethod('popoverDidShow:', 'v@:@@', function(self, cmd, notif) {
      try {
        this.fireEvent('open');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    PopOverDelegateClass.addMethod('popoverWillShow:', 'v@:@@', function(self, cmd, notif) {
      try {
        this.fireEvent('before-open');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    
    this.native('setDelegate', PopOverDelegateClass('alloc')('init'));

    var MyViewControllerClass = $.NSViewController.extend('MyViewControllerClass'+Math.round(Math.random()*10000));
    MyViewControllerClass.addMethod('loadView','v@:', function(self,cmd) { self('setView',this.nativeView); }.bind(this));
    MyViewControllerClass.register();
    var myViewControllerInstance = MyViewControllerClass('alloc')('initWithNibName',null,'bundle',null);

    this.native('setContentViewController',myViewControllerInstance);

    Object.defineProperty(this, 'width', {
      get:function() { return this.native('contentSize').width; },
      set:function(e) {
        if(!open) { this.addEventListener('before-open', function() { open = true; this.width = e; }.bind(this)); }
        else {
          var rect = this.native('contentSize');
          rect.width = e;
          this.native('setContentSize', rect);
        }
      }
    });

    Object.defineProperty(this, 'height', {
      get:function() { return this.native('contentSize').height; },
      set:function(e) {
        if(!open) { this.addEventListener('before-open', function() { open = true; this.height = e; }.bind(this)); }
        else {
          var rect = this.native('contentSize');
          rect.height = e;
          this.native('setContentSize', rect);
        }
      }
    });

    this.open = function(container, side) {
      var edge = side == 'left' ? $.NSMinXEdge : side == 'right' ? $.NSMaxXEdge :
                 side == 'top' ? $.NSMinYEdge : $.NSMaxYEdge;

      // The timeout is necessary, popover will not show if the view
      // has yet to complete its layout, give it a tick to calculate.
      setTimeout(function() {
        this.native('showRelativeToRect', $.NSMakeRect(0,0,0,0),
                    'ofView', container.nativeView,
                    'preferredEdge', edge);
      }.bind(this), 100);
    }

    this.close = function() {
      this.native('performClose',this.native);
    }

  }
  PopOver.prototype = Object.create(Container.prototype);
  PopOver.prototype.constructor = PopOver;
  return PopOver;
})();
