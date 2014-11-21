module.exports = (function() {
  var Window = require('Window');
  var $ = process.bridge.objc;

  /**
   * @class Panel
   * @description A Panel is similar to a window although it should be viewed as either a utility or tool window.
   *              It differs from a regular Window in that: It uses a smaller title bar, and does not have minimize
   *              or maximize capabilities.  It uses slightly different styles than a normal window. It disappears
   *              automatically if the application looses focus and reappears when it regains it.  Panels may also 
   *              "Dock" their content into another window.  Panels are useful as "Tool" windows.  They can contain
   *              a set of buttons that perhaps changes the behavior of something.  For example, in Photoshop the 
   *              floating set of buttons to select the current action (select, bucket, fill, etc) would be a panel.
   *              Panels inherit all of the capabilities (minus Window.state) of the regular Window class.
   * @extends Window
   */
  /**
   * @new 
   * @memberof Panel
   * @description Creates a new panel that is initially hidden.
   */
  function Panel(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.styleMask = options.styleMask || ($.NSHUDWindowMask | $.NSTitledWindowMask | $.NSUtilityWindowMask | 
                                    $.NSClosableWindowMask | $.NSResizableWindowMask | $.NSMiniaturizableWindowMask );
    options.width = options.width || 200;
    options.height = options.height || 250;

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Window.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Window.call(this, $.NSPanel, $.NSView, options);

    this.native('setFloatingPanel', $.YES);
  }

  Panel.prototype = Object.create(Window.prototype);
  Panel.prototype.constructor = Panel;

  /**
   * @member style
   * @type {string}
   * @memberof Panel
   * @description Gets or sets the style of the panel.  This can be "window" for an apperance as similar to a normal
   *              window as possible, "inspector" for a "Heads Up Display" style window or "utility" for a style that
   *              resembles a native utility window (or panel).  The default is "window".
   * @default "window"
   */
  Object.defineProperty(Panel.prototype, 'style', {
    get:function() { 
      var mask = this.native('styleMask');
      if(($.NSHUDWindowMask & mask) == $.NSHUDWindowMask) return "inspector";
      else if(($.NSUtilityWindowMask & mask) == $.NSUtilityWindowMask) return "utility";
      else return "window";
    },
    set:function(e) {
      var mask = this.native('styleMask');
      if(e == "utility") this.native('setStyleMask', (mask & ~$.NSHUDWindowMask) | $.NSMiniaturizableWindowMask );
      else if(e == "inspector") this.native('setStyleMask', (mask & ~$.NSMiniaturizableWindowMask) | $.NSHUDWindowMask);
    }
  });

  /**
   * @member floating
   * @type {boolean}
   * @memberof Panel
   * @description Gets or sets if the panel is currently floating or docked.
   * @default "window"
   */
  Object.defineProperty(Panel.prototype, 'floating', {
    get:function() { return this.native('isFloatingPanel') == $.YES ? true : false; },
    set:function(e) { this.native('setFloatingPanel', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Panel.prototype, 'toolbar', {
    get:function() { return undefined; },
    set:function(e) { }
  });

  return Panel;
})();