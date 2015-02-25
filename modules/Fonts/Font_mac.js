module.exports = (function() {
  if(global.__TINT.Font) {
    return global.__TINT.Font;
  }
  var $ = process.bridge.objc;
  var $utilities = require('Utilities');
  var fontManager = $.NSFontManager('sharedFontManager');

  /**
   * @class Font
   * @description The Font object represents a native font in javascript.
   */
  /**
   * @new 
   * @memberof Font
   * @param {string} name The name of the font, for example Arial.
   * @param {size} number The size of the font.
   * @description Gets a system font and creates a font object for it.
   * @extends Panel
   */
  function Font(name, size) {
    console.assert(name, 'A family name was not passed in for the font.');
    size = size || 12;
    if(name.type === '@') {
      this.native = name;
    } else if(name.native) {
      this.native = name.native;
    } else {
      this.native = $.NSFont('fontWithName',$(name),'size', size);
    }

    /**
     * @member face
     * @type {string}
     * @memberof Font
     * @description Gets or sets the face fo the font.
     */
    Object.defineProperty(this, 'face', { 
      get:function() { return this.native('fontName').toString(); },
      set:function(e) { this.native = fontManager('convertFont', this.native,'toFace', $(e.toString())); }
    });

    /**
     * @member size
     * @type {number}
     * @memberof Font
     * @description Gets or sets the size of the font in logical pixels.
     * @default 12
     */
    Object.defineProperty(this, 'size', { 
      get:function() { return this.native('pointSize'); },
      set:function(e) { this.native = fontManager('convertFont', this.native, 'toSize', $(e.toString())); }
    }); 

    /**
     * @member family
     * @type {string}
     * @memberof Font
     * @description Gets or sets the font's family.
     * @default 12
     */
    Object.defineProperty(this, 'family', { 
      get:function() { return this.native('familyName').toString(); },
      set:function(e) { this.native = fontManager('convertFont', this.native, 'toFamily', $(e.toString())); }
    });

    var convertFont = function(boolValue, on, off) {
      if(boolValue) {
          this.native = fontManager('convertFont', this.native,'toHaveTrait', on);
          this.native = fontManager('convertFont', this.native,'toNotHaveTrait', off);
        } else {
          this.native = fontManager('convertFont', this.native,'toNotHaveTrait', on);
          this.native = fontManager('convertFont', this.native,'toHaveTrait', off);
        }
    }.bind(this);

    /**
     * @member italic
     * @type {boolean}
     * @memberof Font
     * @description Gets or sets whether the font is italicized.
     * @default false
     */
    Object.defineProperty(this, 'italic', {
      get:function() { return (fontManager('traitsOfFont', this.native) & $.NSItalicFontMask) === $.NSItalicFontMask ? true : false; },
      set:function(e) { convertFont(e, $.NSItalicFontMask, $.NSUnitalicFontMask); }
    });

    /**
     * @member bold
     * @type {boolean}
     * @memberof Font
     * @description Gets or sets whether the font is bolded. Note, for finer control over the font's boldness use the weight property.
     * @default false
     */
    Object.defineProperty(this, 'bold', {
      get:function() { return (fontManager('traitsOfFont', this.native) & $.NSBoldFontMask) === $.NSBoldFontMask ? true : false; },
      set:function(e) { convertFont(e, $.NSBoldFontMask, $.NSUnboldFontMask); }
    });

    /**
     * @member expanded
     * @type {boolean}
     * @memberof Font
     * @description Gets or sets whether the font is expanded.
     * @default false
     */
    Object.defineProperty(this, 'expanded', {
      get:function() { return (fontManager('traitsOfFont', this.native) & $.NSExpandedFontMask) === $.NSExpandedFontMask ? true : false; },
      set:function(e) { convertFont(e, $.NSExpandedFontMask, $.NSCondensedFontMask); }
    });

    /**
     * @member monospaced
     * @type {boolean}
     * @memberof Font
     * @description Gets whether the font is monospaced.
     */
    Object.defineProperty(this, 'monospaced', { get:function() { return this.native('isFixedPitch'); } });

    /**
     * @member vertical
     * @type {boolean}
     * @memberof Font
     * @description Gets whether the font is vertical or horizontal.
     */
    Object.defineProperty(this, 'vertical', { get:function() { return this.native('isVertical'); } });

    /**
     * @member weight
     * @type {number}
     * @memberof Font
     * @description Gets or sets the boldness of the font, this can be a range from 0 to 999.
     * @default 400
     */
    Object.defineProperty(this, 'weight', {
      get:function() { return fontManager('weightOfFont',this.native)*100; },
      set:function(e) {
        var weight = e;
        var traits = fontManager('traitsOfFont', this.native);
        if(weight <= 500 && (traits & $.NSBoldFontMask) === $.NSBoldFontMask) {
          traits = traits ^ $.NSBoldFontMask;
        } else if (weight > 500 && (traits & $.NSBoldFontMask) !== $.NSBoldFontMask) {
          traits = traits | $.NSBoldFontMask;
        }
        this.native = fontManager('fontWithFamily', this.native('familyName'), 'traits', traits, 'weight', (weight/100), 'size', this.native('pointSize'));
      }
    });
  }

  /**
   * @member fonts
   * @type {array}
   * @memberof Font
   * @description Gets a list of all available fonts on the system.  This is a 'static' method, 
   *              and does not require creating a font (E.g., Font.fonts).
   */
  Object.defineProperty(Font, 'fonts', {
    get:function() { return $utilities.nsArrayToArray(fontManager('availableFonts')); }
  });

  /**
   * @member fontFamilies
   * @type {array}
   * @memberof Font
   * @description Gets a list of all available font families installed on the system.
   */
  Object.defineProperty(Font, 'fontFamilies', {
    get:function() { 
      var fonts = $utilities.nsArrayToArray(fontManager('availableFontFamilies'));
      for(var i=0; i < fonts.length ; i++) {
        fonts[i] = fonts[i].toString();
      }
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
  global.__TINT.Font = Font;
  return Font;
})();
