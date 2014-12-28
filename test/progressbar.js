
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
 * @see {ProgressBar}
 * @example
 */
function run($utils) {
  var win = new Window();
  win.visible = true;
  var progress = new ProgressBar();
  var interval;
  //progress.size = "large";
  //progress.indeterminate = false;
  //progress.border = true;
  //process.style = "bar";

  setTimeout(function() {
    interval = setInterval(function() { 
      progress.value = progress.value + 1/60;
      if(progress.value >= 1) {
        clearInterval(interval);
        $utils.ok();
      }
    }, 1000/60);

  },1000);

  win.appendChild(progress);
  progress.top = 0;
  progress.left = 0;
  progress.right = 0;
  progress.height = 20;
  
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
  name:"ProgressBar",
};