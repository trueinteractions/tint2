var fs = require('fs');
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

/**
 * @see {Screens}
 * @example
 */
function run($utils) {
  System.clipboardSet('so tell me what you want what you really really want.', 'text');
  var b = System.clipboardGet('text');
  $utils.assert(b.length !== 0);
  $utils.assert(b.toString() === 'so tell me what you want what you really really want.');
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
  name:"Clipboard",
};