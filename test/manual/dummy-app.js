/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
}

function baseline() {
}

/**
 * @example
 */
function run($utils) {
  require('Application');

  var Window = require('Window');
  var Button = require('Button');

  var mainWindow = new Window();
  var button = new Button();

  mainWindow.title = 'DailyJS';

  button.title = 'Hello';
  button.addEventListener('mousedown', function() {
    button.title = '^_^';
  });

  button.addEventListener('mouseup', function() {
    button.title = 'Hello';
  });

  mainWindow.appendChild(button);

  mainWindow.addLayoutConstraint({
    priority: 'required',
    relationship: '=',
    firstItem: button,
    firstAttribute: 'top',
    secondItem: mainWindow,
    secondAttribute: 'bottom',
    multiplier: 0.0,
    constant: 0.0
  });

  setInterval(function() {
    button.title = Math.random();
  }, 1000);

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
  name:"AppDelegatesAndDock"
};


