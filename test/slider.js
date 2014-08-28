
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.Slider = require('Slider');
}

function baseline() {
}

/**
 * @see {Slider}
 * @example
 */
function run($utils) {
  var win = new Window();
  var slider = new Slider();

  win.appendChild(slider);
  /* @hidden */ win.x = 0;
  /* @hidden */ win.y = 0;
  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:slider, firstAttribute:'top',
    secondItem:win, secondAttribute:'top',
    multiplier:1.0, constant:0.0
  });
  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:slider, firstAttribute:'left',
    secondItem:win, secondAttribute:'left',
    multiplier:1.0, constant:0.0
  });
  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:slider, firstAttribute:'right',
    secondItem:win, secondAttribute:'right',
    multiplier:1.0, constant:0.0
  });
  win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:slider, firstAttribute:'bottom',
    secondItem:win, secondAttribute:'top',
    multiplier:1.0, constant:20.0
  });

  setTimeout(function() {
    $utils.clickAt(239,55);
    setTimeout(function() {
      $utils.assert(Math.round(slider.value * 1000) == 477);
      $utils.ok();
    },500);
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
  name:"Slider",
};