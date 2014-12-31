
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
  application.exitAfterWindowsClose = false;
  var win = new Window();
  win.visible = true;
  var buttonNormal = new Button();
  buttonNormal.title = "Animate Size";
  win.appendChild(buttonNormal);
  buttonNormal.top = 0;
  buttonNormal.width = 200;

  buttonNormal.preferences.animateOnSizeChange = true;
  
  /*var start = process.hrtime();
  setTimeout(function() {
    var interval = setInterval(function() {
      if(buttonNormal.top === 300) {
        var end = process.hrtime(start);
        console.log(end);
        clearInterval(interval);
        $utils.ok();
      }
      buttonNormal.top++;
    },5);
  }, 1000);*/
  
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