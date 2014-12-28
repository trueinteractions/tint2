module.exports = (function() {
  if(global.__TINT.Panel) {
    return global.__TINT.Panel;
  }
  var util = require('Utilities');
  var Window = require('Window');
  var $ = process.bridge.objc;

  var inspectorStyle =  ( $.NSHUDWindowMask | $.NSUtilityWindowMask | $.NSTitledWindowMask | $.NSClosableWindowMask | $.NSResizableWindowMask );
  var utilityStyle =  ( $.NSUtilityWindowMask | $.NSTitledWindowMask | $.NSClosableWindowMask | $.NSResizableWindowMask );

  /**
   * @class Panel
   * @description A Panel is similar to a window although it should be viewed as either a utility or tool window.
   *              It differs from a regular Window in that: It uses a smaller title bar, and does not have minimize
   *              or maximize capabilities.  It uses slightly different styles than a normal window. It disappears
   *              automatically if the application looses focus and reappears when it regains it. Panels are useful as 
   *              "Tool" windows.  For example, in Photoshop the floating set of buttons to select the current action 
   *              (select, bucket, fill, etc) would be a panel.
   *              Panels inherit all of the capabilities with the exception of window state capabilities (maximize, minimize
   *              and fullscreen).
   * @extends Window
   */
  /**
   * @new 
   * @memberof Panel
   * @description Creates a new panel that is initially hidden.
   */
  function Panel(options) {
    options = options || {};
    options.delegates = options.delegates || [];
    this.nativeClass = this.nativeClass || $.NSPanel;
    this.nativeViewClass = this.nativeViewClass || $.NSView;
    options.styleMask = options.styleMask || ((Panel.initialStyle == "utility") ? utilityStyle : inspectorStyle);
    options.width = options.width || 200;
    options.height = options.height || 250;
    Window.call(this, options);
    this.native('setFloatingPanel', $.YES);
  }
  Panel.prototype = Object.create(Window.prototype);
  Panel.prototype.constructor = Panel;
  Panel.initialStyle = "utility";

  /**
   * @member style
   * @type {string}
   * @memberof Panel
   * @description Gets or sets the style of the panel.  This can be "window" for an apperance as similar to a normal
   *              window as possible, "inspector" for a "Heads Up Display" style window or "utility" for a style that
   *              resembles a native utility window (or panel).  The default is "window".
   * @default "window"
   */
  util.def(Panel.prototype, 'style',
    function() { 
      var mask = this.native('styleMask');
      if( ($.NSHUDWindowMask & mask) === $.NSHUDWindowMask ) {
        return "inspector";
      } else if( ($.NSUtilityWindowMask & mask) === $.NSUtilityWindowMask ) {
        return "utility";
      } else {
        return "window";
      }
    },
    function(e) {
      if(e == "utility") {
        this.native('setStyleMask', utilityStyle);
      } else if(e == "inspector") {
        this.native('setStyleMask', inspectorStyle);
      }
    }
  );

  /**
   * @member floating
   * @type {boolean}
   * @memberof Panel
   * @description Gets or sets if the panel is currently floating or docked.
   * @default "window"
   */
  util.def(Panel.prototype, 'floating',
    function() { return this.native('isFloatingPanel') === $.YES ? true : false; },
    function(e) { this.native('setFloatingPanel', e ? $.YES : $.NO); }
  );

  global.__TINT.Panel = Panel;

  return Panel;
})();