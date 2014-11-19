
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
  if($utils.debug) $utils.ok(); // TODO: short circuit this for appveyor until we have a better control.
  /* @hidden */ var ismac = require('os').platform().toLowerCase() == "darwin";
  var panel = new FontPanel();
  panel.visible = true;
  /* @hidden */ var trackChange = false;
  /* @hidden */ var trackNewChange = false;
  /* @hidden */ panel.x=0;
  /* @hidden */ panel.y=0;
  /* @hidden */ panel.width = 500;
  /* @hidden */ panel.height = 280;
  panel.addEventListener('fontchange', function() {
    /* @hidden */ if($utils.debug) $utils.log('panel.fontchange\n');
    /* @hidden */ if(trackChange){
    var selected = panel.selected;
    /* @hidden */   $utils.assert(selected.face.indexOf('Arial') > -1);
    /* @hidden */   $utils.assert(Math.round(selected.size) === 15, 'size was: ' + selected.size);
    /* @hidden */   $utils.assert(selected.family === 'Arial');
    /* @hidden */   $utils.assert(selected.italic === false);
    /* @hidden */   $utils.assert(selected.bold === false);
    /* @hidden */   $utils.assert(selected.weight === 500);
    /* @hidden */   
    /* @hidden */   setTimeout(function() {
    /* @hidden */     trackChange = false;
    /* @hidden */     trackNewChange = true;
    /* @hidden */     panel.selected = new Font('Times New Roman', 12);
    /* @hidden */     var font = panel.selected;
    /* @hidden */     $utils.assert(font.family === 'Times New Roman');
    /* @hidden */     $utils.assert(font.size === 12);
    /* @hidden */     $utils.ok();
    /* @hidden */   },1000);
    /* @hidden */ } 
  });

  if(ismac) {
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
  /* @hidden */           $utils.clickAt(440,109);
  /* @hidden */           $utils.keyAtControl('1');
  /* @hidden */           $utils.keyAtControl('5');
  /* @hidden */           trackChange = true;
  /* @hidden */           $utils.keyAtControl('RETURN');
  /* @hidden */         },500);
  /* @hidden */       },500);
  /* @hidden */     },500);
  /* @hidden */   },500);
  /* @hidden */ },500);
  } else {
  /* @hidden */  setTimeout(function() {
  /* @hidden */     $utils.clickAt(500,160);
  /* @hidden */    setTimeout(function() {
  /* @hidden */      $utils.clickAt(500,160);
  /* @hidden */      $utils.keyAtControl('a');
  /* @hidden */      $utils.keyAtControl('r');
  /* @hidden */      $utils.keyAtControl('i');
  /* @hidden */      $utils.keyAtControl('a');
  /* @hidden */      $utils.keyAtControl('l');
  /* @hidden */      $utils.keyAtControl('TAB');
  /* @hidden */      $utils.keyAtControl('TAB');
  /* @hidden */      $utils.keyAtControl('1');
  /* @hidden */      $utils.keyAtControl('5');
  /* @hidden */      trackChange = true;
  /* @hidden */      $utils.keyAtControl('RETURN');
  /* @hidden */    },2500)
  /* @hidden */  },2500);
  }
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
  timeout:true,
  name:"FontPanel",
};
