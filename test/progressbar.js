
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.ProgressBar = require('ProgressBar');
}

function baseline() {
}

/**
 * @see {Notification}
 * @example
 */
function run($utils) {
  /* @hidden */ count = 0;
  var win = new Window();
  var progress = new ProgressBar();
  var interval;
  progress.size = "large";
  progress.indeterminate = false;
  progress.border = true;

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
  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:progress, firstAttribute:'top',
    secondItem:win, secondAttribute:'bottom',
    multiplier:0.0, constant:0.0
  });
  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:progress, firstAttribute:'left',
    secondItem:win, secondAttribute:'left',
    multiplier:1.0, constant:0.0
  });
  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:progress, firstAttribute:'right',
    secondItem:win, secondAttribute:'right',
    multiplier:1.0, constant:0.0
  });

  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:progress, firstAttribute:'bottom',
    secondItem:win, secondAttribute:'bottom',
    multiplier:0.0, constant:20.0
  });
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