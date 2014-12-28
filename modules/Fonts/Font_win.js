module.exports = (function() {
  if(global.__TINT.Font) {
    return global.__TINT.Font;
  }
  var $ = process.bridge.dotnet;
  var $utilities = require('Utilities');

  function Font(name, size) {
    console.assert(name, 'A family name was not passed in for the font.');

    size = size || 12;
    this.native = null;
    this.private = {
      size:size,
      face:name,
      family:name,
      italic:false,
      bold:false,
      expanded:false,
      monospaced:false,
      vertical:false,
      linespacing:1,
      weight:500
    };

    function rebuildNativeFont(obj, useFamily) {
      var family = new $.System.Windows.Media.FontFamily(useFamily ? obj.private.family : obj.private.face);
      var style = $.System.Windows.FontStyles.Normal;
      if(obj.private.italic) {
        style = $.System.Windows.FontStyles.Italic;
      }

      var weights = $.System.Windows.FontWeights;
      var weight = obj.private.weight;

      if(weight < 100) {
        weight = weights.Thin;
      } else if (weight < 200) {
        weight = weights.UltraLight;
      } else if (weight < 300) {
        weight = weights.Light;
      } else if (weight < 400) {
        weight = weights.Regular;
      } else if (weight < 500) {
        weight = weights.Medium;
      } else if (weight < 600) {
        weight = weights.SemiBold;
      } else if (weight < 700) {
        weight = weights.Bold;
      } else if (weight < 800) {
        weight = weights.UltraBold;
      } else if (weight < 900) {
        weight = weights.Heavy;
      } else if (weight < 999) {
        weight = weights.UltraBlack;
      } else {
        weight = weights.Regular;
      }

      var stretch = obj.private.expanded ? $.System.Windows.FontStretches.Expanded : $.System.Windows.FontStretches.Medium;
      var fallback = new $.System.Windows.Media.FontFamily('Arial');

      obj.native = new $.System.Windows.Media.Typeface(family,style,weight,stretch,fallback);

      var familyNames = family.FamilyNames;
      var en = familyNames.Values.GetEnumerator();
      en.MoveNext();
      obj.private.family = en.Current;

      var faceNames = obj.native.FaceNames;
      var en2 = faceNames.Values.GetEnumerator();
      en2.MoveNext();
      obj.private.face = obj.private.family + " " + en2.Current;
    }

    rebuildNativeFont(this);

    Object.defineProperty(this, 'face', { 
      get:function() { return this.private.face; },
      set:function(e) {
        this.private.face = e;
        rebuildNativeFont(this);
      }
    });

    Object.defineProperty(this, 'size', { 
      get:function() { return this.private.size; },
      set:function(e) {
        this.private.size = e;
        rebuildNativeFont(this);
      }
    }); 

    Object.defineProperty(this, 'family', { 
      get:function() { return this.private.family; },
      set:function(e) {
        this.private.family = e;
        rebuildNativeFont(this, true);
      }
    });

    Object.defineProperty(this, 'italic', {
      get:function() { return this.private.italic; },
      set:function(e) { 
        this.private.italic = e ? true : false;
        rebuildNativeFont(this);
      }
    });

    Object.defineProperty(this, 'bold', {
      get:function() { return this.private.bold; },
      set:function(e) {
        if(e) {
          this.private.bold = true;
          this.private.weight = 900;
        } else {
          this.private.bold = false;
          this.private.weight = 500;
        }
        rebuildNativeFont(this);
      }
    });

    Object.defineProperty(this, 'linespacing', {
      get:function() { return this.private.linespacing; },
      set:function(e) { 
        this.private.linespacing = e;
        rebuildNativeFont(this);
      }
    });

    Object.defineProperty(this, 'expanded', {
      get:function() { return this.private.expanded; },
      set:function(e) { 
        this.private.expanded = e ? true : false;
        rebuildNativeFont(this);
      }
    });

    Object.defineProperty(this, 'monospaced', { 
      get:function() { return this.private.monospaced; } 
    });

    Object.defineProperty(this, 'vertical', { 
      get:function() { return this.private.vertical; } 
    });

    Object.defineProperty(this, 'weight', {
      get:function() { return this.private.weight; },
      set:function(e) { 
        if(e > 999) e = 900;
        if(e < 100) e = 100;
        this.private.weight = e;
        if(this.private.weight >= 500)
          this.private.bold = true;
        else
          this.private.bold = false;
        rebuildNativeFont(this);
      }
    });
  }

  Object.defineProperty(Font, 'fonts', {
    get:function() {
      var fonts = $.System.Windows.Media.Fonts.SystemFontFamilies.GetEnumerator();
      var names = [];
      while(fonts.MoveNext()) {
        var font = fonts.Current;
        names.push(font.Source);
      }
      return names;
    }
  });

  Object.defineProperty(Font, 'fontFamilies', {
    get:function() {
      var fonts = $.System.Windows.Media.Fonts.SystemFontFamilies.GetEnumerator();
      var names = [];
      while(fonts.MoveNext()) {
        var font = fonts.Current;
        names.push(font.Source);
      }
      return names;
    }
  });

  //TODO: Not sure what this is.
  //Object.defineProperty(Font, 'fontCollections', {
  //  get:function() { }
  //});
  //Font.fontsInFamily = function(family) { }

  global.__TINT.Font = Font;
  return Font;
})();
