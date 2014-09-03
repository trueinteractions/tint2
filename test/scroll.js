
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
 * @see {Scroll}
 * @example
 */
function run($utils) {
  //UNSTABLE, NOT FINISHED.
  $ = process.bridge.objc;
  var win = new Window();
  var scrollview = new Scroll();
  var genericview = new Container();
  var buttonTest = new Button();
  buttonTest.title = "Foo";
  scrollview.setChild(genericview);
  scrollview.horizontal = true;
  scrollview.vertical = true;
  win.appendChild(scrollview);

  scrollview.left = scrollview.top = 0;
  scrollview.width = '100%';
  scrollview.height = '100%';
  buttonTest.left = buttonTest.top = 0;
  genericview.left = genericview.top = 0;
  genericview.width = '100%';
  genericview.height = '4500px';
  for(var i=0; i < 100; i++) {
    var button = new Button();
    button.title = "My Button "+i;
    genericview.appendChild(button);

    button.left=0;
    button.top = i*35;
  }
  //$utils.ok();
  //scrollview.setChild(genericview);
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
  name:"ScrollView",
};