
/**
 * @unit-test-setup
 * @ignore
function setup() {
 */
  require('Application');
  global.Window = require('Window');
  global.Button = require('Button');
/*}

function baseline() {
}
*/
/**
 * @see {Notification}
 * @example

function run($utils) { */
  /* @hidden */ count = 0;
  var win = new Window();
  /*var buttonNormal = new Button();
  buttonNormal.title = "Hello";
  win.appendChild(buttonNormal);*/

  /*win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:buttonNormal, firstAttribute:'top',
    secondItem:win, secondAttribute:'top',
    multiplier:1, constant:0
  });*/
  /*win.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:buttonNormal, firstAttribute:'bottom',
    secondItem:win, secondAttribute:'bottom',
    multiplier:0.25, constant:0
  });*/
  /*buttonNormal.addLayoutConstraint({
    priority:'required', relationship:'='
  })*/
/*
}

/ **
 * @unit-test-shutdown
 * @ignore
 * /
function shutdown() {
}

module.exports = {
  setup:setup, 
  run:run, 
  shutdown:shutdown, 
  shell:false,
  name:"Layout",
};*/