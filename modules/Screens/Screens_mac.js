module.exports = (function() {
  $ = process.bridge.objc;
  $utilities = require('Utilities');

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

    Object.defineProperty(this, 'active', { get:function() { return getScreenInfo($.NSScreen('mainScreen')); } });

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