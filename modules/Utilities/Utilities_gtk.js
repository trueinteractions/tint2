module.exports = (function() {
  if(global.__TINT.Utilities) {
    return global.__TINT.Utilities;
  }

  var baseUtilities = require('Utilities_base');
  global.__TINT.Utilities = baseUtilities;
  return baseUtilities;
})();