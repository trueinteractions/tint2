
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
 * @see {Table}
 * @example
 */
function run($utils) {
  // TODO: Design unit tests.
  var mainWindow = new Window();
  var table = new Table();
  var scroll = new Scroll();
  var textInput = new TextInput();

  mainWindow.appendChild(scroll);
  table.addEventListener('row-added', function(e) {  });
  table.addEventListener('row-removed', function(e) { });
  table.addEventListener('select', function(e) { });
  textInput.value = "Test";
  scroll.setChild(table);
  scroll.left = scroll.right = scroll.top = scroll.bottom = 0;
  scroll.left = null; // test for left acceptance.
  scroll.left = 0;

  table.alternatingColors = true;
  table.addColumn('First Column');
  table.addColumn('Second Column');
  table.addColumn('Third Column');
  table.addRow();
  table.addRow();
  table.addRow();
  table.setValueAt('First Column',0,textInput);
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
  name:"Table",
};