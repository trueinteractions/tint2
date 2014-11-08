
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
  var fonts = Font.fontFamilies;
  var found = false;
  for(var i=0; i < fonts.length; i++)
    if(fonts[i].indexOf('Arial') != -1) found = true;
  $utils.assert(found);
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