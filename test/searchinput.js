
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
 * @see {Notification}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  mainWindow.visible = true;
  var input = new SearchInput();
  var button = new Button();
  var cancelbutton = new Button();
  input.searches = ["Bar","Ok"];
  button.image = "reload";
  button.height = 15;
  button.width = 15;
  button.style = "none";
  button.border = false;
  button.addEventListener('mousedown', function() {
  });

  cancelbutton.image = "cancel";
  cancelbutton.height = 15;
  cancelbutton.width = 15;
  cancelbutton.style = "none";
  cancelbutton.border = false;
  cancelbutton.addEventListener('mousedown', function() {
  });

  mainWindow.appendChild(input);
  input.right = 10;
  input.top = 0;
  input.width = 200;
  input.searchButton = button;
  input.cancelButton = cancelbutton;
  input.addEventListener('inputend', function() {
  });
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
  name:"SearchInput",
};