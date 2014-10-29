
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
 * @see {DropDown}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  mainWindow.visible = true;
  var label = new TextInput();

  label.readonly = true;
  label.value = "This is a label";
  label.top = 10;
  label.height = 25;
  label.left = 10;
  label.right = 10;

  
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
  someMenuItem.addEventListener('click', function() { });
  someMenu.appendChild(someMenuItem);
  var someOtherSuperMenuItem = new MenuItem('This Item');
  var someOtherMenuItem = new MenuItem("New","n","shift");
  someOtherMenuItem.enabled = true;
  someOtherSuperMenuItem.addEventListener('click', function() {
    $utils.ok();
  });
  var someOtherMenu = new Menu("SomeMenu2");
  someOtherMenu.appendChild(someOtherMenuItem);
  someOtherSuperMenuItem.submenu = someOtherMenu;
  dockmenu.appendChild(someSuperMenuItem);
  dockmenu.appendChild(someOtherSuperMenuItem);
  dropdown.options = dockmenu;

  mainWindow.appendChild(label);
  mainWindow.appendChild(dropdown);

  setTimeout(function() {
    dropdown.value = "Foo";
    $utils.clickAtControl(dropdown);
    var b = dropdown.boundsOnScreen;
    setTimeout(function() {
      $utils.clickAt(b.x+20,b.y+30);
    },200);
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
  name:"DropDown",
};