
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

  var buttonSecond = new Button();
  var buttonThird = new Button();
  var buttonNormal = new Button();
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

  /* @hidden */ var winbnds = win.bounds;
  /* @hidden */ var bnds1 = buttonNormal.bounds;
  /* @hidden */ var bnds2 = buttonSecond.bounds;
  /* @hidden */ var bnds3 = buttonThird.bounds;
  
  /* @hidden */ $utils.assert(bnds1.width == 100, 'width does not equal 100: '+bnds1.width);
  /* @hidden */ $utils.assert(bnds1.x == Math.round(winbnds.width/2 - bnds1.width/2), ' x value is: '+bnds1.x+ ' and should be: '+Math.round(winbnds.width/2 - bnds1.width/2));
  /* @hidden */ $utils.assert(bnds1.y <= Math.round((winbnds.height/2 - bnds1.height/2)), ' y value is: '+bnds1.y+ ' and should be: '+Math.round(winbnds.height/2 - bnds1.height/2));
 
  /* @hidden */ $utils.assert(bnds2.x == (winbnds.width - bnds2.width), 'x value '+bnds2.x+' does not equal: '+(winbnds.width - bnds2.width));
  /* @hidden */ $utils.assert(bnds2.y == 0, 'bounds should be 0, but was: '+bnds2.y);
  
  /* @hidden */ $utils.assert(bnds3.x == 0, 'bounds should be 0, but was: '+bnds3.x);
  /* @hidden */ $utils.assert(bnds3.y == 0, 'bounds should be 0, but was: '+bnds3.y);

  buttonNormal.title = "Hello2";
  buttonNormal.middle = '50%';
  buttonNormal.center = '50%';
  buttonNormal.width = '100%';

  buttonSecond.title = "Second2";
  buttonSecond.bottom = 0;
  buttonSecond.right = 0;

  buttonThird.title = "Third2";
  buttonThird.right = 0;
  buttonThird.top = 0;

  /* @hidden */ bnds1 = buttonNormal.bounds;
  /* @hidden */ bnds2 = buttonSecond.bounds;
  /* @hidden */ bnds3 = buttonThird.bounds;
  
  /* @hidden */ $utils.assert(bnds1.width == winbnds.width, 'bnds width '+bnds1.width+' does not equal window bounds width: '+winbnds.width);
  
  /* @hidden */ $utils.ok();
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