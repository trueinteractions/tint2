
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
  popOver.visible = true;
  var webView = new WebView();
  var opened = false;

  // PopOver's like windows must have a fixed width/height.
  popOver.width = 300;
  popOver.height = 200;
  // Add the web view as a child of the pop over.
  popOver.appendChild(webView);
  // When the pop over launches it'll show our github URL.
  webView.location = "https://www.github.com/trueinteractions/tint2";
  // Take up as much space as possible in the popOver.
  webView.left=webView.right=webView.top=webView.bottom=0;
  // Set the image in the image well to our logo.
  imagewell.image = "app://assets/tintcompiler.png";
  // Override the status bar with custom behavior.
  statusbar.custom = imagewell;
  // When the image well is clicked launch the pop over (or close it if open)
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
  //});
  
  // If we want to do some behavior on mouse up.
  //imagewell.addEventListener('mouseup', function() {
  //});
  
  // If the user clicks into the pop over close it, this only applies
  // to the frame of the pop over, not its children.
  popOver.addEventListener('mousedown', function() {
    popOver.close();
    opened = false;
  });

  /* @hidden */ setTimeout(function(){
  /* @hidden */   bounds = imagewell.boundsOnScreen;
  /* @hidden */   activeBounds = Screens.active.bounds;
  /* @hidden */   xPos = activeBounds.x + bounds.x;
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
  timeout:true,
  shutdown:shutdown, 
  shell:false,
  name:"CustomStatusBar",
};