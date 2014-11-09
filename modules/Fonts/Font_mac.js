module.exports = (function() {
  $ = process.bridge.objc;
  $utilities = require('Utilities');
  var fontManager = $.NSFontManager('sharedFontManager');

  function Font(name, size) {
    console.assert(name, 'A family name was not passed in for the font.');
    if(name.type == '@')
      this.native = name;
    else
      this.native = $.NSFont('fontWithName',$(name),'size', size);

    Object.defineProperty(this, 'face', { 
      get:function() { return this.native('fontName').toString(); },
      set:function(e) { 
        this.native = fontManager('convertFont', this.native,'toFace', $(e.toString()));
      }
    });
    Object.defineProperty(this, 'size', { 
      get:function() { return this.native('pointSize'); },
      set:function(e) { 
        this.native = fontManager('convertFont', this.native, 'toSize', $(e.toString()));
      }
    }); 
    Object.defineProperty(this, 'family', { 
      get:function() { return this.native('familyName').toString(); },
      set:function(e) { 
        this.native = fontManager('convertFont', this.native, 'toFamily', $(e.toString()));
      }
    });
    Object.defineProperty(this, 'italic', {
      get:function() { return (fontManager('traitsOfFont', this.native) & $.NSItalicFontMask) === $.NSItalicFontMask ? true : false; },
      set:function(e) {
        if(e) {
          this.native = fontManager('convertFont', this.native,'toHaveTrait',$.NSItalicFontMask);
          this.native = fontManager('convertFont', this.native,'toNotHaveTrait',$.NSUnitalicFontMask);
        } else {
          this.native = fontManager('convertFont', this.native,'toNotHaveTrait',$.NSItalicFontMask);
          this.native = fontManager('convertFont', this.native,'toHaveTrait',$.NSUnitalicFontMask);
        }
      }
    });
    Object.defineProperty(this, 'bold', {
      get:function() { return (fontManager('traitsOfFont', this.native) & $.NSBoldFontMask) === $.NSBoldFontMask ? true : false; },
      set:function(e) {
        if(e) {
          this.native = fontManager('convertFont', this.native,'toHaveTrait', $.NSBoldFontMask);
          this.native = fontManager('convertFont', this.native,'toNotHaveTrait', $.NSUnboldFontMask);
        } else {
          this.native = fontManager('convertFont', this.native,'toNotHaveTrait', $.NSBoldFontMask);
          this.native = fontManager('convertFont', this.native,'toHaveTrait', $.NSUnboldFontMask);
        }
      }
    });
    Object.defineProperty(this, 'expanded', {
      get:function() { return (fontManager('traitsOfFont', this.native) & $.NSExpandedFontMask) === $.NSExpandedFontMask ? true : false; },
      set:function(e) {
        if(e) {
          this.native = fontManager('convertFont', this.native, 'toHaveTrait', $.NSExpandedFontMask);
          this.native = fontManager('convertFont', this.native, 'toNotHaveTrait', $.NSCondensedFontMask);
        } else {
          this.native = fontManager('convertFont', this.native, 'toNotHaveTrait', $.NSExpandedFontMask);
          this.native = fontManager('convertFont', this.native, 'toHaveTrait', $.NSCondensedFontMask);
        }
      }
    });

    Object.defineProperty(this, 'monospaced', { get:function() { return this.native('isFixedPitch'); } });

    Object.defineProperty(this, 'vertical', { get:function() { return this.native('isVertical'); } });

    Object.defineProperty(this, 'weight', {
      get:function() { return fontManager('weightOfFont',this.native)*100; },
      set:function(e) {
        var weight = e;
        var traits = fontManager('traitsOfFont', this.native);
        if(weight <= 500 && (traits & $.NSBoldFontMask) == $.NSBoldFontMask)
          traits = traits ^ $.NSBoldFontMask;
        else if (weight > 500 && (traits & $.NSBoldFontMask) != $.NSBoldFontMask)
          traits = traits | $.NSBoldFontMask;

        this.native = fontManager('fontWithFamily', this.native('familyName'), 
                                  'traits', traits, 
                                  'weight', (weight/100), 
                                  'size', this.native('pointSize')
                                  );
      }
    });
  }

  Object.defineProperty(Font, 'fonts', {
    get:function() { return $utilities.nsArrayToArray(fontManager('availableFonts')); }
  });

  Object.defineProperty(Font, 'fontFamilies', {
    get:function() { 
      var fonts = $utilities.nsArrayToArray(fontManager('availableFontFamilies'));
      for(var i=0; i < fonts.length ; i++)
        fonts[i] = fonts[i].toString();
      return fonts;
    }
  });
/*
  Object.defineProperty(Font, 'fontCollections', {
    get:function() { return $utilities.nsArrayToArray(fontManager('collectionNames')); }
  });

  Font.fontsInFamily = function(family) {
    var data = $utilities.nsArrayToArray(fontManager('availableMembersOfFontFamily',$(family.toString())));
    var values = [];
    for(var i=0; i < data.length; i++) {
      var traits = data[i]('objectAtIndex',3);
      var nameObj = data[i]('objectAtIndex',0).toString();
      var styleNameObj = data[i]('objectAtIndex',1).toString();
      var obj = {
        name:nameObj,
        styleName:styleNameObj,
        weight:data[i]('objectAtIndex',2)*100,
        isBold:(((traits & $.NSBoldFontMask) === $.NSBoldFontMask) ? true : false ),
        isItalic:(((traits & $.NSItalicFontMask) === $.NSItalicFontMask) ? true : false),
        isNonStandard:(((traits & $.NSNonStandardCharacterSetFontMask) === $.NSNonStandardCharacterSetFontMask) ? true : false),
        isNarrow:(((traits & $.NSNarrowFontMask) === $.NSNarrowFontMask) ? true : false),
        isExpanded:(((traits & $.NSExpandedFontMask) === $.NSExpandedFontMask) ? true : false),
        isCondensed:(((traits & $.NSCondensedFontMask) === $.NSCondensedFontMask) ? true : false),
        isPoster:(((traits & $.NSPosterFontMask) === $.NSPosterFontMask) ? true : false),
        isCompressed:(((traits & $.NSCompressedFontMask) === $.NSCompressedFontMask) ? true : false),
        isFixed:(((traits & $.NSFixedPitchFontMask) === $.NSFixedPitchFontMask) ? true : false)
      }
      values.push(obj);
    }
    return values;
  }
*/
  return Font;
})();
