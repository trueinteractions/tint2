
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
 * @example
 */
function run($utils) {
  $utils.ok(); // disabled for now.
  var mainWindow = new Window();
  mainWindow.visible = true;
  var input = new FileInput();

  mainWindow.appendChild(input);

  input.top = 10;
  input.height = 25;
  input.left = 10;
  input.right = 10;

  input.location = "C:\\Windows\\regedit.exe";

  var dropdown = new DropDown();
  dropdown.top = 35;
  dropdown.left = 10;
  dropdown.right = 10;
  dropdown.height = 25;

  var dockmenu = new Menu("DockMenu");
  var someMenu = new Menu("SomeMenu");
  var someSuperMenuItem = new MenuItem('Some Item 1');
  someSuperMenuItem.submenu = someMenu;
  var someMenuItem = new MenuItem("Test Menu","z");
  someMenu.appendChild(someMenuItem);
  var someOtherSuperMenuItem = new MenuItem('This Item');
  var someOtherMenuItem = new MenuItem("New","n","shift");
  someOtherMenuItem.enabled = true;

  var someOtherMenu = new Menu("SomeMenu2");
  someOtherMenu.appendChild(someOtherMenuItem);
  someOtherSuperMenuItem.submenu = someOtherMenu;
  dockmenu.appendChild(someSuperMenuItem);
  dockmenu.appendChild(someOtherSuperMenuItem);
  dropdown.options = dockmenu;

  mainWindow.appendChild(dropdown);


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
  name:"FileInput",
};