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
 * @see {Window}
 * @example
 */
function run($utils) {
  var win = new Window();
  win.visible = true;

  var text1tabbed = 0;
  var text2tabbed = 0;

  var text1 = new TextInput();
  win.appendChild(text1);
  text1.on('inputend', function() { text1tabbed++; });

  text1.left = text1.top = 10;
  text1.width = 200;
  text1.height = 22;
  var text2 = new TextInput();
  win.appendChild(text2);
  text2.left = 10;
  text2.top = 40;
  text2.width = 200;
  text2.height = 22;
  text2.on('inputend', function() { text2tabbed++; });
  setTimeout(function() {
    text1.focus();
    System.sendKey('TAB');
    System.sendKey('TAB');
    setTimeout(function() {
      $utils.assert(text1tabbed === 1 && text2tabbed === 1, 'Tabbing wasnt the correct value:'+text1tabbed+' '+text2tabbed);
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
  name:"TabbingBetweenWindows",
};