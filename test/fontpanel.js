
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
 * @see {Fonts}
 * @see {FontPanel}
 * @example
 */
function run($utils) {
  var panel = new FontPanel();
  /* @hidden */ var trackChange = false;
  /* @hidden */ var trackNewChange = false;
  /* @hidden */ panel.x=0;
  /* @hidden */ panel.y=0;
  /* @hidden */ panel.width = 500;
  /* @hidden */ panel.height = 500;
  panel.addEventListener('fontchange', function() {
    /* @hidden */ if(trackChange){
    var selected = panel.selected;
    /* @hidden */   $utils.assert(selected.face.indexOf('Arial') > -1);
    /* @hidden */   $utils.assert(selected.size === 15);
    /* @hidden */   $utils.assert(selected.family === 'Arial');
    /* @hidden */   $utils.assert(selected.italic === false);
    /* @hidden */   $utils.assert(selected.bold === false);
    /* @hidden */   $utils.assert(selected.weight === 500);
    /* @hidden */   
    /* @hidden */   setTimeout(function() {
    /* @hidden */     trackChange = false;
    /* @hidden */     trackNewChange = true;
    /* @hidden */     panel.selected = new Font('Helvetica', 12);
    /* @hidden */   },500);
    /* @hidden */ } else if (trackNewChange) {
    /* @hidden */   var font = panel.selected;
    /* @hidden */   $utils.assert(font.family === 'Helvetica');
    /* @hidden */   $utils.assert(font.size === 12);
    /* @hidden */   $utils.ok();
    /* @hidden */ }
  });

  /* @hidden */ setTimeout(function() {
  /* @hidden */   $utils.clickAt(58,109);
  /* @hidden */   setTimeout(function() {
  /* @hidden */     $utils.clickAt(220,109);
  /* @hidden */     setTimeout(function() {
  /* @hidden */       $utils.keyAtControl('a');
  /* @hidden */       $utils.keyAtControl('r');
  /* @hidden */       $utils.keyAtControl('i');
  /* @hidden */       $utils.keyAtControl('a');
  /* @hidden */       $utils.keyAtControl('l');
  /* @hidden */       setTimeout(function() {
  /* @hidden */         $utils.clickAt(320,109);
  /* @hidden */         setTimeout(function() {
  /* @hidden */           $utils.clickAt(450,109);
  /* @hidden */           $utils.keyAtControl('1');
  /* @hidden */           $utils.keyAtControl('5');
  /* @hidden */           trackChange = true;
  /* @hidden */           $utils.keyAtControl('RETURN');
  /* @hidden */         },500);
  /* @hidden */       },500);
  /* @hidden */     },500);
  /* @hidden */   },500);
  /* @hidden */ },500);
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
  name:"FontPanel",
};