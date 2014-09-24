
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
 */
function run($utils) {
  var win = new Window();
  var dateWell = new DateWell();
  win.title = "Date well should be 0.5 alpha.";
  dateWell.style = "clock";
  dateWell.range = true;
  win.appendChild(dateWell);
  dateWell.left = dateWell.top = 0;
  dateWell.width = '300px';
  dateWell.alpha = 0.5;

  setTimeout(function() { 
    $utils.assert(dateWell.alpha == 0.5);
    $utils.ok();
  },1000);
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
  name:"AlphaControlTest",
};