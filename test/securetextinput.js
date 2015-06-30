
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
 * @see {SecureTextInput}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  mainWindow.visible = true;
  var input = new SecureTextInput();
  var input2 = new SecureTextInput();

  mainWindow.appendChild(input);
  mainWindow.appendChild(input2);

  input.textcolor = 'rgba(0,0,0,0.8);';
  input.top = 10;
  input.height = 25;
  input.left = 10;
  input.right = 10;
  input2.top = 55;
  input2.left = 10;
  input2.right = 10;
  input2.height = 25;

  /* @hidden */ var inputStart = false;
  /* @hidden */ var inputEnd = false;
  /* @hidden */ var inputEv = false;
  /* @hidden */ var keydownEv = false;
  /* @hidden */ var keyupEv = false;
  /* @hidden */ var mouseupEv = false;
  /* @hidden */ var mousedownEv = false; 
  input.addEventListener('mousedown', function(e) {
    /* @hidden */ mousedownEv = true;
  });
  input.addEventListener('mouseup', function(e) { 
    /* @hidden */ mouseupEv = true;
    /* @hidden */ $utils.assert(mousedownEv);
    /* @hidden */ $utils.keyAtControl('a');
  }); 
  input.addEventListener('inputstart', function(e) {
    /* @hidden */ $utils.assert(mouseupEv);
    /* @hidden */ $utils.assert(mousedownEv);
    /* @hidden */ inputStart = true; 
  });
  input.addEventListener('keydown', function(e) {
    /* @hidden */ keydownEv = true;
    /* @hidden */ $utils.assert(mousedownEv);
    /* @hidden */ $utils.assert(mouseupEv);
    /* @hidden */ $utils.assert(inputStart);
  }); 
  input.addEventListener('input', function(e) {
    /* @hidden */ $utils.assert(mousedownEv);
    /* @hidden */ $utils.assert(mouseupEv);
    /* @hidden */ $utils.assert(inputStart);
    /* @hidden */ $utils.assert(keydownEv);
    /* @hidden */ $utils.assert(input.value == 'a');
    /* @hidden */ inputEv = true; 
  });
  input.addEventListener('keyup', function(e) {
    /* @hidden */ keyupEv = true;
    /* @hidden */ $utils.assert(inputEv);
    /* @hidden */ $utils.assert(mousedownEv);
    /* @hidden */ $utils.assert(mouseupEv);
    /* @hidden */ $utils.assert(inputStart);
    /* @hidden */ $utils.assert(keydownEv);
    /* @hidden */ $utils.assert(input.value == 'a');
    /* @hidden */ $utils.clickAtControl(input2);
  });
  input.addEventListener('inputend', function(e) {
    /* @hidden */ $utils.assert(keyupEv);
    /* @hidden */ $utils.assert(inputEv);
    /* @hidden */ $utils.assert(mousedownEv);
    /* @hidden */ $utils.assert(mouseupEv);
    /* @hidden */ $utils.assert(inputStart);
    /* @hidden */ $utils.assert(keydownEv);
    /* @hidden */ $utils.assert(input.value == 'a');
    /* @hidden */ $utils.ok();
  });
  /* @hidden */ input.addEventListener('rightmousedown', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('rightmouseup', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseenter', function(e) { }); // doesn't work
  /* @hidden */ input.addEventListener('mouseexit', function(e) { }); // doesn't work

  /* @hidden */ setTimeout(function() { $utils.clickAtControl(input); }, 500);
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
  name:"SecureTextInput",
};