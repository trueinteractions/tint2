
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
 * @see {Buttons}
 * @example
 */
function run($utils) {
  global.application.exitAfterWindowsClose = false;
  var win = new Window();
  win.visible = true;
  var buttonNormal = new Button();
  buttonNormal.title = "Animate Size";
  win.appendChild(buttonNormal);
  buttonNormal.top = 0;
  buttonNormal.width = 200;

  buttonNormal.animateOnSizeChange = true;
  
  setTimeout(function() {
    buttonNormal.width = 300;
    buttonNormal.top = 200;
    setTimeout(function() {
      $utils.assert(buttonNormal.bounds.y < 230 && buttonNormal.bounds.y > 180, 'buttons y bounds was a bit weird. ' + buttonNormal.bounds.y);
      $utils.assert(buttonNormal.bounds.width > 290 && buttonNormal.bounds.width < 310, 'buttons width was a bit weird. ' + buttonNormal.bounds.width);
      $utils.ok();
    }, 500);
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
  timeout:false,
  name:"Animation",
};