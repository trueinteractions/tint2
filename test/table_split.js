
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
  var win = new Window();
  var split = new Split();
  var table = new Table();
  table.addEventListener('selected', function() {
    $utils.ok();
  });
  split.left=split.right=split.top=split.bottom=0;
  table.addColumn('Company');
  table.addRow(0);
  table.setValueAt('Company',0,'Hello');
  split.appendChild(table);
  win.appendChild(split);
  win.visible = true;
  setTimeout(function() {
    split.setPosition(0.5, 0);
    $utils.clickAt(win.boundsOnScreen.x + 10, win.boundsOnScreen.y + ((process.platform.indexOf('win32') != -1) ? 40 : 0) );
  },500)
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
  name:"TableSplitTest",
};