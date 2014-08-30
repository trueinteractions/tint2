  // Include the widgets we'll need. Note you can individually include Application, TextInput, WebView etc.
  require('Common');

  // Create the widgets.
  var mainWindow = new Window();
  var urlLocation = new TextInput();
  var webView = new WebView();
  var toolbar = new Toolbar();
  var backButton = new Button();
  var forwardButton = new Button();

  // Images can be a URL or a string representing a built in OS icon.
  backButton.image = 'back';
  forwardButton.image = 'forward';

  // Attach our webview to the window
  mainWindow.width = 800;
  mainWindow.height = 500;
  mainWindow.appendChild(webView);

  // everything else goes into the toolbar.
  toolbar.appendChild([backButton, forwardButton, 'space', urlLocation, 'space']);
  mainWindow.toolbar = toolbar;

  // Set some styling.
  mainWindow.titleVisible = false;
  mainWindow.preferences.animateOnSizeChange = true;
  mainWindow.preferences.animateOnPositionChange = true;

  urlLocation.alignment = 'center';
  urlLocation.linewrap = false;
  urlLocation.scrollable = true;

  // Attach some listeners to go back/forward and change the URL.
  backButton.addEventListener('click',function() { webView.back(); });
  forwardButton.addEventListener('click',function() { webView.forward(); });

  urlLocation.addEventListener('inputend', function() {
    var url = urlLocation.value;
    if(url.indexOf(':') == -1) url = "http://"+url;
    webView.location = url;
  });

  webView.addEventListener('load', function() { urlLocation.value = webView.location; });

  // Tell the webview to take up as much space in the parent as possible.
  webView.left = webView.top = webView.right = webView.left = '0%';

  // Set the URL to somewhere.
  webView.location = 'https://www.google.com/';