module.exports = (function() {
  $ = process.bridge.dotnet;
  $utilities = require('Utilities');

  function Font(name, size) {
    console.assert(name, 'A family name was not passed in for the font.');

    Object.defineProperty(this, 'face', { 
      get:function() { },
      set:function(e) { }
    });
    Object.defineProperty(this, 'size', { 
      get:function() { },
      set:function(e) { }
    }); 
    Object.defineProperty(this, 'family', { 
      get:function() { },
      set:function(e) { }
    });
    Object.defineProperty(this, 'italic', {
      get:function() { },
      set:function(e) { }
    });
    Object.defineProperty(this, 'bold', {
      get:function() { },
      set:function(e) { }
    });
    Object.defineProperty(this, 'expanded', {
      get:function() { },
      set:function(e) {  }
    });

    Object.defineProperty(this, 'monospaced', { get:function() { } });

    Object.defineProperty(this, 'vertical', { get:function() {  } });

    Object.defineProperty(this, 'weight', {
      get:function() { },
      set:function(e) { }
    });
  }

  Object.defineProperty(Font, 'fonts', {
    get:function() {  }
  });

  Object.defineProperty(Font, 'fontFamilies', {
    get:function() { }
  });

  Object.defineProperty(Font, 'fontCollections', {
    get:function() { }
  });

  Font.fontsInFamily = function(family) {
    
  }
  return Font;
})();
