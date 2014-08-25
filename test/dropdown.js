
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.TextInput = require('TextInput');
  global.DropDown = require('DropDown');
  global.Menu = require('Menu');
  global.MenuItem = require('MenuItem');
}

function baseline() {
}

/**
 * @see {Notification}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  var input = new TextInput();
  var dropdown = new DropDown();
  var dockmenu = new Menu("DockMenu");
  var someMenu = new Menu("SomeMenu");
  var someSuperMenuItem = new MenuItem('Some Item 1');
  someSuperMenuItem.submenu = someMenu;
  var someMenuItem = new MenuItem("Test Menu","z");
  someMenuItem.addEventListener('click', function() { });
  someMenu.appendChild(someMenuItem);
  var someOtherSuperMenuItem = new MenuItem('This Item');
  var someMenuItem3 = new MenuItem("New","n","shift");
  someMenuItem3.enabled = true;
  someMenuItem3.addEventListener('click', function() { });
  var someMenu2 = new Menu("SomeMenu2");
  someMenu2.appendChild(someMenuItem3);
  someOtherSuperMenuItem.submenu = someMenu2;
  dockmenu.appendChild(someSuperMenuItem);
  dockmenu.appendChild(someOtherSuperMenuItem);

  dropdown.options = dockmenu;

  input.value = "This is a label";

  mainWindow.appendChild(input);
  mainWindow.appendChild(dropdown);
  input.readonly = true;

  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'bottom',
    multiplier:0.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:0.0, constant:35.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:0.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:dropdown, firstAttribute:'top',
    secondItem:input, secondAttribute:'bottom',
    multiplier:1.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:dropdown, firstAttribute:'bottom',
    secondItem:input, secondAttribute:'bottom',
    multiplier:1.0, constant:30.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:dropdown, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:0.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:dropdown, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
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
  name:"DropDown",
};