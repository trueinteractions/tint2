
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
  /* @hidden */ var count = 0;
  application.exitAfterWindowsClose = false;
  var win = new Window();
  win.visible = true;
  var buttonNormal = new Button();
  buttonNormal.title = "Hello";
  buttonNormal.addEventListener('mousedown', function() {
    /* @hidden */ count++;
  });
  buttonNormal.addEventListener('mouseup', function() {
    /* @hidden */ $utils.clickAtControl(buttonToggle);
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
    /* @hidden */ count++;
    /* @hidden */ $utils.clickAtControl(buttonRadio);
  });
  win.appendChild(buttonToggle);
  buttonToggle.top = buttonNormal;

  var buttonRadio = new Button();
  buttonRadio.title = "Radio Box 1";
  buttonRadio.type = "radio";
  buttonRadio.state = false;
  buttonRadio.addEventListener('mousedown', function() {
    /* @hidden */ count++;
  });
  buttonRadio.addEventListener('mouseup', function() {
    buttonRadio1.state = false;
    buttonRadio.state = true;
    /* @hidden */ $utils.clickAtControl(buttonRadio1);
  });
  win.appendChild(buttonRadio);
  buttonRadio.top = buttonToggle;

  var buttonRadio1 = new Button();
  buttonRadio1.title = 'Radio Box 2 (Selected)';
  buttonRadio1.type = 'radio';
  buttonRadio1.state = 'true';

  buttonRadio1.addEventListener('mousedown', function() {
    /* @hidden */ count++;
    /* @hidden */ $utils.assert(buttonRadio.title == "Radio Box 1");
    /* @hidden */ $utils.assert(buttonRadio.type == "radio");
    /* @hidden */ $utils.assert(buttonRadio.state == true, 'buttonRadio.state should equal true, instead: ',buttonRadio.state);
    /* @hidden */ $utils.assert(buttonRadio1.title == "Radio Box 2 (Selected)");
    /* @hidden */ $utils.assert(buttonRadio1.type == "radio");
    /* @hidden */ $utils.assert(buttonRadio1.state == false);
    /* @hidden */ $utils.assert(buttonToggle.title == "On");
    /* @hidden */ $utils.assert(buttonToggle.type == "toggle");
    /* @hidden */ $utils.assert(buttonToggle.state == true);
    /* @hidden */ $utils.assert(buttonNormal.title == "Hello");
    /* @hidden */ $utils.assert(buttonNormal.type == "normal");
    /* @hidden */ $utils.assert(count == 4);
    buttonRadio1.state = true;
    buttonRadio.state = false;
    /* @hidden */ $utils.assert(buttonRadio1.state == true);
    /* @hidden */ $utils.assert(buttonRadio.state == false);
    /* @hidden */ win.destroy();
    /* @hidden */ $utils.ok();
  });
  win.appendChild(buttonRadio1);
  buttonRadio1.left = buttonRadio;
  buttonRadio1.middle = buttonRadio;


  /* @hidden */ setTimeout(function() { $utils.clickAtControl(buttonNormal); }, 1000);
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
  timeout:false,
  name:"Buttons",
};