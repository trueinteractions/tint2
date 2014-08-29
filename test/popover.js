
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

  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:label, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:1.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:label, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:1.0, constant:25.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:label, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:1.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:label, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popOpen, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:1.0, constant:55.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popOpen, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:1.0, constant:85.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popOpen, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:1.0, constant:10.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popOpen, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
  });


  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'top',
    secondItem:popOver, secondAttribute:'top',
    multiplier:1.0, constant:10.0
  });
  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'bottom',
    secondItem:popOver, secondAttribute:'top',
    multiplier:1.0, constant:35.0
  });
  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'left',
    secondItem:popOver, secondAttribute:'left',
    multiplier:1.0, constant:10.0
  });
  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:input, firstAttribute:'right',
    secondItem:popOver, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
  });
  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popClose, firstAttribute:'top',
    secondItem:input, secondAttribute:'top',
    multiplier:1.0, constant:25.0
  });
  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popClose, firstAttribute:'bottom',
    secondItem:input, secondAttribute:'bottom',
    multiplier:1.0, constant:45.0
  });
  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popClose, firstAttribute:'left',
    secondItem:popOver, secondAttribute:'left',
    multiplier:1.0, constant:10.0
  });
  popOver.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:popClose, firstAttribute:'right',
    secondItem:popOver, secondAttribute:'right',
    multiplier:1.0, constant:-10.0
  });

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
