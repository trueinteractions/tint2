
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
 * @see {Buttons}
 * @example
 */
function run($utils) {
   var count = 0;
  application.exitAfterWindowsClose = false;
  var win = new Window();
  win.visible = true;
  var buttonNormal = new Button();
  buttonNormal.title = "Hello";
  buttonNormal.addEventListener('mousedown', function() {
     count++;
  });
  buttonNormal.addEventListener('mouseup', function() {
     $utils.clickAtControl(buttonToggle);
  });
  win.appendChild(buttonNormal);

  buttonNormal.top = 0;

  var buttonToggle = new Button();
  buttonToggle.title = "Off";
  buttonToggle.type = "toggle";
  buttonToggle.state = false;
  buttonToggle.addEventListener('mousedown', function() {
    $utils.assert(buttonToggle.state == false);
  });

  buttonToggle.addEventListener('mouseup', function() {
    $utils.assert(buttonToggle.state == true);
    buttonToggle.title = buttonToggle.state == false ? "Off" : "On";
     count++;
     $utils.clickAtControl(buttonRadio);
  });
  win.appendChild(buttonToggle);
  buttonToggle.top = buttonNormal;

  var buttonRadio = new Button();
  buttonRadio.title = "Radio Box 1";
  buttonRadio.type = "radio";
  buttonRadio.state = false;
  buttonRadio.addEventListener('mousedown', function() {
     count++;
  });
  buttonRadio.addEventListener('mouseup', function() {
    buttonRadio1.state = false;
    buttonRadio.state = true;
     $utils.clickAtControl(buttonRadio1);
  });
  win.appendChild(buttonRadio);
  buttonRadio.top = buttonToggle;
  buttonRadio.left = 0;

  var buttonRadio1 = new Button();
  buttonRadio1.title = 'Radio Box 2 (Selected)';
  buttonRadio1.type = 'radio';
  buttonRadio1.state = 'true';
  buttonRadio1.addEventListener('mousedown', function() {
     count++;
     $utils.assert(buttonRadio.title == "Radio Box 1");
     $utils.assert(buttonRadio.type == "radio");
     $utils.assert(buttonRadio.state == true, 'buttonRadio.state should equal true, instead: ',buttonRadio.state);
     $utils.assert(buttonRadio1.title == "Radio Box 2 (Selected)");
     $utils.assert(buttonRadio1.type == "radio");
     $utils.assert(buttonRadio1.state == false);
     $utils.assert(buttonToggle.title == "On");
     $utils.assert(buttonToggle.type == "toggle");
     $utils.assert(buttonToggle.state == true);
     $utils.assert(buttonNormal.title == "Hello");
     $utils.assert(buttonNormal.type == "normal");
     $utils.assert(count == 4);
    buttonRadio1.state = true;
    buttonRadio.state = false;
     $utils.assert(buttonRadio1.state == true);
     $utils.assert(buttonRadio.state == false);
     win.destroy();
     $utils.ok();
  });
  win.appendChild(buttonRadio1);
  buttonRadio1.left = 0;
  buttonRadio1.top = buttonRadio;


   setTimeout(function() { $utils.clickAtControl(buttonNormal); }, 1000);
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
  timeout:1000,
  name:"Buttons",
};