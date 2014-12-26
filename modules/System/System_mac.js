module.exports = (function() {
  var $ = process.bridge.objc;
  var utils = require('Utilities');


  /**
   * @class System
   * @description The system class contains methods for getting OS standard file system icons,
   *        preferences, settings and information.
   */
  function System() {}

  /**
   * @method getIconForFile
   * @memberof System
   * @param {string} file The path to the file to return its icon used in the system shell.
   * @description Returns an image (data uri base 64 encoded) for the icon used by the system shell.
   */
  System.getIconForFile = function(e) {
    var img = $.NSWorkspace('sharedWorkspace')('iconForFile', $(e));
    return utils.makeURIFromNSImage(img);
  }
  return System;

})();