
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
 * @see {DateWell}
 * @example
 */
function run($utils) {
  //TODO: Add more thorough unit tests for this.
  var win = new Window();
  var dateWell = new DateWell();
  dateWell.style = "clock";
  dateWell.range = true;
  win.appendChild(dateWell);
  dateWell.left = dateWell.top = 0;
  dateWell.width = '300px';
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
  name:"DateWell",
};