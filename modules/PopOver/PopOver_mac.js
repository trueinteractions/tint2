module.exports = (function() {
  if(global.__TINT.PopOver) {
    return global.__TINT.PopOver;
  }

  var Container = require('Container');
  var $ = process.bridge.objc;

  /**
   * @class PopOver
   * @description Creates a pop-over that can extend outside of a window bounds as a floating
   *              panel above the control.  The pop over is useful for providing ancillary information
   *              or to collect non-required information.  It can also be used as a tool tip for users
   *              as to how to use a program.
   * @extends Container
   */
   /**
    * @new
    * @memberof PopOver
    * @description Creates a new PopOver control.
    */
  function PopOver(options) {
    options = options || {};
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

  /**
   * @member width
   * @type {Integer}
   * @memberof PopOver
   * @description Gets or sets the width of the pop over.
   */
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

  /**
   * @member height
   * @type {Integer}
   * @memberof PopOver
   * @description Gets or sets the height of the pop over.
   */
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

  /**
   * @method open
   * @param {Container} container The container or control to place the pop over.. over.
   * @param {string} side The side to present the pop over on, this must be "left", "right", "top" or "bottom".
   * @memberof PopOver
   * @description The open method opens the pop over over the control or container specified, with the position
   *              provided as a string "left", "right", "top" or "bottom".
   */
  PopOver.prototype.open = function(container, side) {
    var edge = side === 'left' ? $.NSMinXEdge : side === 'right' ? $.NSMaxXEdge : side === 'top' ? $.NSMaxYEdge : $.NSMinYEdge;
    // The timeout is necessary, popover will not show if the view
    // has yet to complete its layout, give it a tick to calculate.
    var containerNative = container.nativeView ? container.nativeView : container.native;
    if(container.__proto__.constructor.name === "StatusBar") {
      if(containerNative('respondsToSelector', '_button')) {
        containerNative = containerNative('_button');
      }
    }
    setTimeout(function() {
      this.native('showRelativeToRect', $.NSMakeRect(0,0,0,0), 
        'ofView', containerNative, 'preferredEdge', edge);
    }.bind(this), 100);
  }

  /**
   * @method close
   * @memberof PopOver
   * @description Closes the pop over.
   */
  PopOver.prototype.close = function() {
    this.native('performClose',this.native);
  }

  global.__TINT.PopOver = PopOver;
  return PopOver;
})();
