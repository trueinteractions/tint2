module.exports = (function() {
  if(global.__TINT.Window) {
    return global.__TINT.Window;
  }
  var $ = process.bridge.gobj.gtk;

  function Window(options) {
    options = options || {};
    options.width = options.width || 500;
    options.height = options.height || 500;
    //this.nativeClass = this.nativeClass || $.System.Windows.Window;
    //this.nativeViewClass = this.nativeViewClass || $.AutoLayout.AutoLayoutPanel;
    //Container.call(this, options);
  }

  Window.prototype = Object.create(Container.prototype);
  Window.prototype.constructor = Window;


  //util.makePropertyBoolType(Window.prototype, 'frame', 'WindowStyle', 
  //  $.System.Windows.WindowStyle.SingleBorderWindow, $.System.Windows.WindowStyle.None);

  
  Object.defineProperty(Window.prototype, 'textured', {
    get:function() { },
    set:function(e) {
    }
  });

  //TODO: Implement me
  //Object.defineProperty(Window.prototype, 'shadow', {
  //  get:function() { },
  //  set:function(e) { }
  //});

  util.def(Window.prototype, 'menu', 
    function() {  },
    function(e) {
    });

  util.def(Window.prototype, 'toolbar',
    function() {  },
    function(e) {
    });

  util.def(Window.prototype, 'canBeFullscreen',
    function() { return this.private.canBeFullscreen; },
    function(e) { this.private.canBeFullscreen = e ? true : false; }
  );

  util.def(Window.prototype, 'state',
    function() {
      return "fullscreen";
      return "maximized";
      return "minimized";
      return "normal";
    },
    function(e) {
      if(e !== "fullscreen" && this.private.fullscreen) {
      } 
      
      if(e === 'maximized') {
      } else if (e === 'normal') {
      } else if (e === 'minimized') {
      } else if (e === 'fullscreen' && !this.private.fullscreen) {
      }
    });

  //util.makePropertyStringType(Window.prototype, 'title', 'Title');


  function setWindowCoordinates(type, winObj, value) {

    if(value === 'center') {

    } else {

    }
  }

  util.def(Window.prototype, 'y',
    function() {  },
    function(e) { }
  );

  util.def(Window.prototype, 'x',
    function() { },
    function(e) { }
  );

  util.def(Window.prototype, 'width',
    function() {},
    function(e) {
    }
  );

  util.def(Window.prototype, 'height',
    function() {  },
    function(e) { }
  );

  //TODO: Implement me
  //Object.defineProperty(Window.prototype, 'titleVisible', {
  //  get:function() { return true; },
  //  set:function(e) { /* TODO ? */ }
  //});

  util.def(Window.prototype, 'transparent',
    function() {  },
    function(e) {
    });

  // Override Control's definition of visible to a window context.
  util.def(Window.prototype, 'visible',
    function() { },
    function(e) {
    }
  );

  util.def(Window.prototype, 'maximizeButton',
    function() {
    },
    function(e) {
    }
  );

  util.def(Window.prototype, 'minimizeButton',
    function() {
    },
    function(e) {
    }
  );

  util.def(Window.prototype, 'closeButton',
    function() { },
    function(e) {

    }
  );

  util.def(Window.prototype, 'resizable',
    function() {
    },
    function(e) {
    }
  );

  util.def(Window.prototype, 'backgroundColor',
    function() { },
    function(e) {
      if(e === 'auto') {
      } else if (e === 'transparent' || (e.indexOf('rgba') > -1 && e.indexOf('0)') > -1)) {
      } else {
      }
    }
  );

  //util.makePropertyBoolType(Window.prototype, 'alwaysOnTop', 'TopMost', true, false);

  Window.prototype.destroy = function() {
  };

  Window.prototype.bringToFront = function() {
  };

  global.__TINT.Window = Window;
  return Window;
})();
