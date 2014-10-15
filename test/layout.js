
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
 * @example
 */
function run($utils) {

  // TODO: Fix height %
  var win = new Window();
  win.visible = true;

  //var webView = new WebView();
  //win.appendChild(webView);
  //webView.location = "https://www.google.com";
  //webView.left = webView.right = webView.top = webView.bottom = 0;
  win.width = 700;

  //$utils.assert(win.boundsOnScreen.width === webView.boundsOnScreen.width, // @hidden
  //  'window width: '+win.boundsOnScreen.width+' webview width: '+webView.boundsOnScreen.width);  // @hidden

  var buttonNormal = new Button();
  var buttonSecond = new Button();
  var buttonThird = new Button();

  buttonNormal.title = "Hello";
  buttonNormal.middle = '100%';
  buttonNormal.center = '100%';
  buttonNormal.width = '200px';
  buttonNormal.width = '100px';

  buttonSecond.title = "Second";
  buttonSecond.top = 0;
  buttonSecond.right = 0;

  buttonThird.title = "Third";
  buttonThird.left = 0;
  buttonThird.top = 0;

  win.appendChild(buttonSecond);
  win.appendChild(buttonNormal);
  win.appendChild(buttonThird);
/*
  setTimeout(function() {

    buttonNormal.title = "Hello2";
    buttonNormal.middle = '50%';
    buttonNormal.center = '50%';
    //buttonNormal.width = '100%';

    buttonSecond.title = "Second";
    //buttonSecond.bottom = 0;
    //buttonSecond.right = 0;

    buttonThird.title = "Third";
    //buttonThird.left = 0;
    //buttonThird.bottom = 0;
  },2000);*/
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
  name:"Layout",
};