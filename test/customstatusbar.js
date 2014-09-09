
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
 * @see {StatusBar}
 * @example
 */
function run($utils) {
  /* @hidden */ var bounds, activeBounds, xPos;

  var statusbar = new StatusBar();
  var imagewell = new ImageWell();
  var popOver = new PopOver();
  var webView = new WebView();
  var opened = false;

  popOver.width = 300;
  popOver.height = 200;
  popOver.appendChild(webView);

  webView.location = "https://www.github.com/trueinteractions/tint2";
  webView.left=webView.right=webView.top=webView.bottom=0;
  imagewell.image = "app://assets/tintcompiler.png";
  statusbar.custom = imagewell;
  imagewell.addEventListener('mousedown', function() {
    if(!opened) {
      popOver.open(imagewell,'bottom');
      /* @hidden */ setTimeout(function() { 
      /* @hidden */   $utils.clickAt(xPos + bounds.width/2,11);
      /* @hidden */ },1000)
    }
    else {
      popOver.close();
      /* @hidden */ statusbar.close();
      /* @hidden */ $utils.ok();
    }

    opened = !opened;
  });

  // If we want to do some behavior on right mouse clicks.
  //imagewell.addEventListener('rightmousedown', function() {
  //  console.log('we dont have anything to do on right mouse down...');
  //});
  
  // If we want to do some behavior on mouse up.
  //imagewell.addEventListener('mouseup', function() {
  //});
  

  popOver.addEventListener('mousedown', function() {
    popOver.close();
    opened = false;
  });

  /* @hidden */ setTimeout(function(){
  /* @hidden */   bounds = imagewell.boundsOnScreen;
  /* @hidden */   activeBounds = Screens.active.bounds;
  /* @hidden */   xPos = activeBounds.width + bounds.x;
  /* @hidden */   $utils.clickAt(xPos + bounds.width/2,11);
  /* @hidden */ }, 2000);
  /* @hidden */ //TODO: Fix click handler on imagewell.
  /* @hidden */ //imagewell.addEventListener('click', function() {
  /* @hidden */ //});
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
  name:"CustomStatusBar",
};