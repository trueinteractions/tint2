module.exports = (function() {
  var $ = process.bridge.objc;

  var currentFont = $.NSFont('userFontOfSize',12.0);

  var TintFontPanel = $.NSFontPanel.extend('TintFontPanel');
  TintFontPanel.addClassMethod('sharedFontPanel', '@@:', function(self,cmd) {
    if(!$.TintFontPanel.panel) 
      $.TintFontPanel.panel = $.TintFontPanel('alloc')('init');
    return $.TintFontPanel.panel;
  });
  
  TintFontPanel.addMethod('setFont:', 'v@:@', function(self,cmd,font) {
    try {
      currentFont = font;
    } catch (e) {
      console.error(e.message);
      console.error(e.stack);
      process.exit(1);
    }
  });

  TintFontPanel.addMethod('font', '@@:', function(self,cmd) {
    try {
      return currentFont;
    } catch (e) {
      console.error(e.message);
      console.error(e.stack);
      process.exit(1);
    }
  });
  TintFontPanel.addMethod('changeAttributes:', 'v@:@', function(self,cmd,notification) {
    try {
      $.TintFontPanel.panel.fireEvent('attributeschange');
    } catch(e) { 
      console.log(e.message);
      console.log(e.stack);
      process.exit(1);
    }; 
  });
  TintFontPanel.addMethod('changeFont:', 'v@:@', function(self,cmd,notification) {
      try {
        $.TintFontPanel.panel.fireEvent('fontchange');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      };
  });
  TintFontPanel.addMethod('fontManager:willIncludeFont:', 'B@:@@', function(self) { return $.YES; }.bind(this));
  TintFontPanel.register();
  $.NSFontManager('setFontPanelFactory', TintFontPanel);
})();