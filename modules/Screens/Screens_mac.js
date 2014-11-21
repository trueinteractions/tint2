module.exports = (function() {
  var $ = process.bridge.objc;
  var $utilities = require('Utilities');
  /**
   * @class Screens
   * @description The Screens class can be used to access information about the attached displays on the device.
   *              Methods on this class are all static and a new Screens object does not need to be created.
   */
  function Screens() {

    function getScreenInfo(nsScreen) {
      var frame = nsScreen('frame');
      var visibleFrame = nsScreen('visibleFrame');
      var obj = {
        bitsPerPixel:$.NSBitsPerPixelFromDepth(nsScreen('depth')),
        scaleFactor:nsScreen('backingScaleFactor'),
        OSSpecificInformation:$utilities.nsDictionaryToObject(nsScreen('deviceDescription')),
        bounds:{
          x:frame.origin.x,
          y:frame.origin.y,
          width:frame.size.width,
          height:frame.size.height
        },
        visibleBounds:{
          x:visibleFrame.origin.x,
          y:visibleFrame.origin.y,
          width:visibleFrame.size.width,
          height:visibleFrame.size.height
        }
      };
      return obj;
    }

    /**
     * @member active
     * @type {object}
     * @memberof Screens
     * @description Gets a reference to the active screen, this returns an object with the following attributes:
     *              'bitsPerPixel', the amount of depth or bits per pixel the screen can render. 'scaleFactor' - the
     *              the number representing how physical pixels are converted to logical pixels, or the sharpness of the screen. 
     *              'bounds' - an object with the properties 'width', 'height', 'x', and 'y' logical pixel values of the active screen. 
     *              'visibleBounds' - an object with the properties 'width', 'height', 'x', and 'y' logical pixel values of the 
     *                              active screens workarea or visible area.
     * @example
     *  var Screens = require('Screens');
     *  var active = Screens.active;
     *  console.log('The active screen's sharpness (scale factor) is:'+active.scaleFactor);
     *  console.log('The active screen's color resolution (bitsPerPixel) is:'+active.bitsPerPixel);
     *  console.log('The active screen width is: '+active.bounds.width+' in logical pixels.');
     *  console.log('The active screen height is: '+active.bounds.height+' in logical pixels.');
     *  // The position of a screen is normalized across all screens.  For example if screen 1 is 
     *  // 0,0 and screen 2 is at left (x) 1025 and top (y) 0 its right to screen 1. 
     *  // Screens can overlap. When mirroring your display two screens will return the same X/Y.
     *  console.log('The active screens left is: '+active.bounds.x+' in logical pixels.');
     *  console.log('The active screens top is: '+active.bounds.y+' in logical pixels.');
     *  // Note that visibleBounds is the work area e.g., where windows are allowed
     *  console.log('The work area width of the active screen is: '+active.visibleBounds.width);
     *  console.log('The work area height of the active screen is: '+active.visibleBounds.height);
     *  console.log('The work area starts at left: '+active.visibleBounds.x);
     *  console.log('The work area starts at top: '+active.visibleBounds.y);
     */
    Object.defineProperty(this, 'active', { get:function() { return getScreenInfo($.NSScreen('mainScreen')); } });

    /**
     * @member all
     * @type {array}
     * @memberof Screens
     * @description Gets an array to all screens attached to the device, the array contains a set of objects with the following attributes:
     *              bitsPerPixel, the amount of depth or bits per pixel the screen can render. scaleFactor - the
     *              the number representing how physical pixels are converted to logical pixels, or the sharpness of the screen. 
     *              bounds - an object with the properties 'width', 'height', 'x', and 'y' logical pixel values of the active screen. 
     *              visibleBounds - an object with the properties 'width', 'height', 'x', and 'y' logical pixel values of the 
     *                              active screens workarea or visible area. 
     * @example
     *  var Screens = require('Screens');
     *  var all = Screens.all;
     *  all.forEach(function(screen, i) {
     *    console.log('The sharpness (scale factor) of screen '+i+' is:'+screen.scaleFactor);
     *    console.log('The color resolution (bitsPerPixel) of screen '+i+' is:'+screen.bitsPerPixel);
     *    console.log('The width of screen '+i+' is: '+screen.bounds.width+' in logical pixels.');
     *    console.log('The height of screen '+i+' is: '+screen.bounds.height+' in logical pixels.');
     *    // The position of a screen is normalized across all screens.  For example if screen 1 is 
     *    // 0,0 and screen 2 is at left (x) 1025 and top (y) 0 its right to screen 1. 
     *    // Screens can overlap. When mirroring your display two screens will return the same X/Y.
     *    console.log('Screen '+i+' left is: '+screen.bounds.x+' in logical pixels.');
     *    console.log('Screen '+i+' top is: '+screen.bounds.y+' in logical pixels.');
     *    // Note that visibleBounds is the work area e.g., where windows are allowed
     *    // if no menubar (in osx), or taskbar exists the width, height will be the same as bounds.
     *    console.log('The workarea width of screen '+i+' is: '+screen.visibleBounds.width);
     *    console.log('The workarea height of screen '+i+' is: '+screen.visibleBounds.height);
     *    console.log('The workarea starts at left: '+screen.visibleBounds.x);
     *    console.log('The workarea starts at top: '+screen.visibleBounds.y);
     *  });
     */
    Object.defineProperty(this, 'all', { 
      get:function() {
        var screens = $.NSScreen('screens');
        var count = screens('count');
        var values = [];
        for(var i=0; i < count; i++) {
          var scrn = getScreenInfo(screens('objectAtIndex',i));
          scrn.isPrimary = (i===0) ? true : false;
          values.push(scrn);
        }
        return values;
      }
    });
  }

  return new Screens();

})();