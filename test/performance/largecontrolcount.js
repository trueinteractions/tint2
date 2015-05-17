var perfdata = {};

function largebuttontest() {
  require('Common');
  var win = new Window();
  win.visible = true;
  var scrollview = new Scroll();
  var genericview = new Container();
  scrollview.setChild(genericview);
  scrollview.horizontal = true;
  scrollview.vertical = true;
  win.appendChild(scrollview);

  scrollview.left = scrollview.top = 0;
  scrollview.width = '100%';
  scrollview.height = '100%';
  genericview.width = '100%';
  genericview.top = 0;
  var previousButton = genericview;
  for(var i=0; i < 500; i++) {
    var button = new Button();
    button.title = "My Button "+(i+1);
    genericview.appendChild(button);
    button.left=0;
    if (i == 99) {
      genericview.bottom = button;
    }
 
    button.top = previousButton;
    button.height = '22px';
    previousButton = button;
  }
}
function smallbuttontest() {
  require('Common');
  var win = new Window();
  win.visible = true;
  var scrollview = new Scroll();
  var genericview = new Container();
  scrollview.setChild(genericview);
  scrollview.horizontal = true;
  scrollview.vertical = true;
  win.appendChild(scrollview);

  scrollview.left = scrollview.top = 0;
  scrollview.width = '100%';
  scrollview.height = '100%';
  genericview.width = '100%';
  genericview.top = 0;
  var previousButton = genericview;
  for(var i=0; i < 100; i++) {
    var button = new Button();
    button.title = "My Button "+(i+1);
    genericview.appendChild(button);
    button.left=0;
    if (i == 99) {
      genericview.bottom = button;
    }
    button.top = previousButton;
    button.height = '22px';
    previousButton = button;
  }
}

perfdata.memoryStart = process.memoryUsage();
perfdata.start = Date.now();
largebuttontest();
perfdata.stop = Date.now();
perfdata.memoryEnd = process.memoryUsage();
perfdata.timeinms = perfdata.stop - perfdata.start;
perfdata.timeinseconds = perfdata.timeinms / 1000;
perfdata.totalmemoryinbytes = perfdata.memoryEnd.heapTotal - perfdata.memoryStart.heapTotal;
perfdata.totalmemoryinkb = perfdata.totalmemoryinbytes / 1024;
perfdata.totalmemoryinmb = perfdata.totalmemoryinkb / 1024;
perfdata.versions = process.versions;
perfdata.platform = process.platform;
perfdata.testname = 'Large Control Count';

var fs = require('fs');
var data = JSON.parse(fs.readFileSync('perfdata.json'));
data.push(perfdata);
fs.writeFileSync('perfdata.json', JSON.stringify(data));
process.exit(0);