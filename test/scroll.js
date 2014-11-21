
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
 * @see {Scroll}
 * @example
 */
function run($utils) {
  //TODO: figure out why performance on appveyor is so slow and remove this circuit break.
  if($utils.debug) $utils.ok();
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
  //genericview.height = '4000px';

  var previousButton = genericview;
  for(var i=0; i < 100; i++) {
    var button = new Button();
    button.title = "My Button "+(i+1);
    genericview.appendChild(button);
    button.left=0;
    /* @hidden */ if (i == 0) {
    /* @hidden */   button.addEventListener('click', function() {
    /* @hidden */     $utils.ok();
    /* @hidden */   });
    /* @hidden */ }
    // This causes the generic view to be the size of its
    // contents, in addition it has each button trailing
    // the next one above it.
    if (i == 99) {
      genericview.bottom = button;
      button.addEventListener('click', function() {
        genericview.scrollTo(0,0);
        /* @hidden */ var bounds = win.boundsOnScreen;
        /* @hidden */ $utils.clickAt(bounds.x+20, bounds.y + 15);
      });
    }
 
    button.top = previousButton;
    button.height = '22px';

    previousButton = button;
  }

  /* @hidden */ setTimeout(function() {
  /* @hidden */   for(var i=0; i < 20; i++)
  /* @hidden */     $utils.scrollAtControl(scrollview, -10);
  /* @hidden */   setTimeout(function() {
  /* @hidden */     var bounds = win.boundsOnScreen;
  /* @hidden */     $utils.clickAt(bounds.x + 20, bounds.y + bounds.height - 20);
  /* @hidden */   },1500);
  /* @hidden */ },2500);
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
  name:"ScrollView",
};