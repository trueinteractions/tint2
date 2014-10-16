
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
  /* @hidden */ var closeClicked = false, openClicked = false, openEvent = false;
  var mainWindow = new Window();
  mainWindow.visible = true;
  var label = new TextInput();
  var popOpen = new Button();
  var input = new TextInput();
  var popClose = new Button();

  mainWindow.appendChild(label);
  mainWindow.appendChild(popOpen);
  label.value = "Some Label..";
  label.readonly = true;
  popOpen.title = "Open Pop-Up";
  popClose.title = "Close Pop-Up";
  var popOver = new PopOver();
  popOver.visible = true;
  popOver.addEventListener('close', function() {
    /* @hidden */ $utils.assert(closeClicked);
    /* @hidden */ $utils.assert(openClicked);
    /* @hidden */ $utils.assert(openEvent);
    /* @hidden */ $utils.ok();
  });
  popOver.addEventListener('open', function() {
    /* @hidden */ openEvent = true;
  });
  popOver.appendChild(input);
  popOver.appendChild(popClose);
  popClose.addEventListener('click', function() {
    /* @hidden */ closeClicked = true;
    popOver.close();
  });
  popOpen.addEventListener('click', function() {
    /* @hidden */ openClicked = true;
    popOver.open(popOpen,'right');
    popOver.height = 75;
    /* @hidden */ setTimeout(function() { $utils.clickAtControl(popClose); },1000);
  });

  label.top = 10;
  label.left = 10;
  label.right = 10;
  popOpen.top = 55;
  popOpen.left = 10;
  popOpen.right = 10;

  input.top = 10;
  input.left = 10;
  input.right = 10;
  popClose.top = 45;
  popClose.left = 10;
  popClose.right = 10;
  
  /* @hidden */ setTimeout(function() {
  /* @hidden */   $utils.clickAtControl(popOpen);
  /* @hidden */ }, 500);
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
  name:"PopOver",
};
