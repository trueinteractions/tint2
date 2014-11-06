
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
  var buttonClicked = 0;
  var baseX, baseY, baseHeight, baseWidth;
  var win = new Window();

  win.visible = true;
  //IE on Windows does not support elements on top of it, 
  //TODO: Re-enable once IE/win build supports this.
  //var webView = new WebView();
  //win.appendChild(webView);
  //webView.location = "https://www.google.com";
  
  win.width = 700;
  var buttonNormal = new Button();
  buttonNormal.addEventListener('click', function() {
    buttonClicked++;
    $utils.clickAt(baseX + baseWidth - 20, baseY + baseHeight - 10);
  });
  buttonNormal.title = "Hello";

  win.appendChild(buttonNormal);

  var buttonSecond = new Button();
  buttonSecond.title = "Second";
  buttonSecond.addEventListener('click', function() {
    buttonClicked++;
    $utils.clickAt(baseX + 20, baseY + (baseHeight/2));
  });
  win.appendChild(buttonSecond);

  var buttonThird = new Button();
  buttonThird.title = "Third";
  buttonThird.addEventListener('click', function() {
    buttonClicked++;
    $utils.clickAt(baseX + 50 + 20, baseY + (baseHeight/2));
  });
  win.appendChild(buttonThird);

  //webView.top = win;
  //webView.left = win;
  //webView.bottom = win;
  //webView.right = win;

  buttonNormal.top = win;
  buttonNormal.left = win;
  buttonNormal.right = win;

  buttonSecond.bottom = win;
  buttonSecond.right = win;
  buttonSecond.width = 100;

  buttonThird.left = win;
  buttonThird.middle = win;
  buttonThird.width = '50px';

  var buttonFourth = new Button();
  buttonFourth.title = "Fourth";
  buttonFourth.addEventListener('click', function() {
    buttonClicked++;
    $utils.assert(buttonClicked == 4);
    $utils.ok();
  });
  win.appendChild(buttonFourth);

  buttonFourth.left = buttonThird;
  buttonFourth.middle = buttonThird;
  buttonFourth.width = '200px';

  setTimeout(function() {
    var bounds = win.boundsOnScreen;
    baseX = bounds.x;
    baseY = bounds.y;
    baseHeight = bounds.height;
    baseWidth = bounds.width;
    $utils.clickAt(baseX + baseWidth/2, baseY + 20);
  },1000);
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
  name:"Layout2",
};
