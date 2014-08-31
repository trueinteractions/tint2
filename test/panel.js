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
 * @see {Panel}
 * @example
 */
function run($utils) {
  var panel = new Panel();
  panel.title = "Hello";
  var text = new TextInput();
  text.value = "This is an inspector panel.";
  text.readonly = true;
  text.textcolor = new Color('white');
  panel.appendChild(text);
  text.width='100%';
  text.top=0;
  text.left=0;
  panel.x='0px';
  panel.y='0px';
  /* @hidden */ panel.addEventListener('close', function() {
   /* @hidden */ $utils.clickAt(10,530);
  /* @hidden */ });


  var panel2 = new Panel();
  panel2.title = "Hello2";
  panel2.style = "utility";
  panel2.x='0px';
  panel2.y='525px';
  panel2.addEventListener('close', function() {
    /* @hidden */ $utils.ok();
  });
  /* @hidden */ setTimeout(function() {
    /* @hidden */ $utils.clickAt(10,30);
  /* @hidden */ },1000);
  
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
  name:"Panel",
};