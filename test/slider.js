
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
 * @see {Slider}
 * @example
 */
function run($utils) {
  var win = new Window();
  win.visible = true;
  var slider = new Slider();

  win.appendChild(slider);
  /* @hidden */ win.x = 0;
  /* @hidden */ win.y = 0;
  slider.top = 20;
  slider.left = slider.right = 0;
  setTimeout(function() {
    $utils.clickAtControl(slider);
    setTimeout(function() {
      $utils.assert(Math.round(Math.round(slider.value*100)/100 * 1000) == 500,'Slider value should be 500, is: '+ (slider.value));
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