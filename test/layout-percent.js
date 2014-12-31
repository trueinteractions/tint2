
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {

    var win = new Window();
    win.visible = true;
    win.width = 500;
    win.height = 500;
    
    var buttonThird = new Button();
    buttonThird.title = "Third";
    buttonThird.left = 0;
    buttonThird.bottom = '-80%';
    win.appendChild(buttonThird);
    $utils.assert(buttonThird.bounds.y > 0, '\n\rResulting y bound was negative, should be positive: ' + buttonThird.bounds.y + '\n\r');
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
  name:"LayoutPercent",
};
