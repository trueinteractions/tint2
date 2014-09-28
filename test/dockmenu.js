
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
 * @see {Application}
 * @example
 */
function run($utils) {
  var win = new Window();

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
  application.dockmenu = dockmenu;
  setTimeout(function(){ 
    win.close();
    $utils.ok();
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
  name:"DockMenu",
};