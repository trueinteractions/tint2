var fs = require('fs');
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Application');
  global.Screens = require('Screens');
}

function baseline() {
}

/**
 * @see {Screens}
 * @example
 */
function run($utils) {
  var mainScreen = Screens.active;
  var any = Screens.all;
  $utils.assert(any.length !== 0);
  $utils.assert(mainScreen);
  $utils.ok();
}

/**
 * @unit-test-shutdown
 * @ignore
 */
function shutdown() {
}

module.exports = {
  setup:setup, 
  run:run, 
  shutdown:shutdown, 
  shell:false,
  name:"Screens",
};