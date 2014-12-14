
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
    buttonThird.bottom = '-20%';
    win.appendChild(buttonThird);

    $utils.assert(buttonThird.bounds.y > 0, 'a negative percentage resulted in a negative y value.');
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
