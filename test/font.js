
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
  var font = new Font('Arial', 12);
  $utils.assert(font.family == 'Arial');
  $utils.assert(font.face.indexOf('Arial') > -1, 'font.face was: '+font.face);
  $utils.assert(font.size === 12);
  $utils.assert(font.italic === false);
  $utils.assert(font.bold === false);
  $utils.assert(font.expanded === false);
  $utils.assert(font.monospaced === false);
  $utils.assert(font.vertical === false);
  // TODO: Should we expect 400 or 500? OSX returns 500 as default regular weight,
  //       Windows and opentype specify 400.
  //$utils.assert(font.weight === 500);
  $utils.assert(font.bold === false);
  font.weight = 1000;
  $utils.assert(font.weight === 900); // Maximum on MacOSX 10.10 for Arial
  $utils.assert(font.bold === true);
  font.bold = true;
  $utils.assert(font.weight === 900);
  $utils.assert(font.bold === true);
  font.bold = false;
  $utils.assert(font.weight === 500, 'expected font.weight==500, but equaled:'+font.weight); // Default for no bolding on MacOSX 10.10 for Arial
  $utils.assert(font.bold === false);
  font.italic = true;
  $utils.assert(font.italic === true);
  font.family = "Times New Roman";
  $utils.assert(font.face.indexOf('Times') > -1, 'font.face was: '+font.face);
  $utils.assert(font.vertical === false);
  $utils.assert(font.monospaced === false);
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
  name:"Font",
};