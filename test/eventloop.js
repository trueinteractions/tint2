
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
* This tests for timeouts and the event loop to correctly run (including callbacks)
*/
function run($utils) {
  var win = new Window();
  win.visible = true;
  var btn = new Button();
  btn.title = "foo";
  btn.left=0;
  btn.top=0;
  btn.bottom=0;
  btn.right=0;
  btn.addEventListener('click', function() {
    var time = process.hrtime();
    setTimeout(function() { 
      var diff = process.hrtime(time);
      $utils.assert((diff[0] * 1e9 + diff[1]) >= 2 * 1e9);
      $utils.ok();
    },2000);
  });
  win.appendChild(btn);

  var time2 = process.hrtime();
  setTimeout(function() {
    var diff = process.hrtime(time2);
    $utils.assert((diff[0] * 1e9 + diff[1]) >= 2 * 1e6, 'timeout executed early, diff was: '+((diff[0] * 1e9 + diff[1])));
    $utils.clickAtControl(btn);
  },20);
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
name:"EventLoop",
};