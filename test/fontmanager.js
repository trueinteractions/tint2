
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
 * @see {Fonts}
 * @example
 */
function run($utils) {
  $utils.assert(Font.fonts.length > 0);
  $utils.assert(Font.fontFamilies.length > 0);
  var helvetica = Font.fontsInFamily("Helvetica");
  $utils.assert(helvetica[0].name.indexOf('Helvetica') !== -1);
  $utils.assert(helvetica[0].weight < 1000 && helvetica[0].weight > 0);
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
  name:"FontManager",
};