module.exports = (function() {
  var Font = require('Font');
  var Color = require('Color');

  function Text(txt) {
    this.private = {}
    this.private.super = String.call(this,txt);
  }

  Text.prototype = Object.create(String.prototype);
  Text.prototype.constructor = Text;

  Text.prototype.concat = function() {
    return this.private.super.concat.apply(this.private.super,arguments);
  }
  Text.prototype.replace = function() {
    return this.private.super.replace.apply(this.private.super,arguments);
  }
  Text.prototype.slice = function() {
    return this.private.super.slice.apply(this.private.super,arguments);
  }
  Text.prototype.split = function() {
    return this.private.super.split.apply(this.private.super,arguments);
  }
  Text.prototype.substr = function() {
    return this.private.super.substr.apply(this.private.super,arguments);
  }
  Text.prototype.substring = function() {
    return this.private.super.substring.apply(this.private.super,arguments);
  }
  Text.prototype.toLocaleLowerCase = function() {
    return this.private.super.toLocaleLowerCase.apply(this.private.super,arguments);
  }
  Text.prototype.toLocaleUpperCase = function() {
    return this.private.super.toLocaleUpperCase.apply(this.private.super,arguments);
  }
  Text.prototype.toLowerCase = function() {
    return this.private.super.toLowerCase.apply(this.private.super,arguments);
  }
  Text.prototype.toUpperCase = function() {
    return this.private.super.toUpperCase.apply(this.private.super,arguments);
  }
  Text.prototype.trim = function() {
    return this.private.super.trim.apply(this.private.super,arguments);
  }
  Text.prototype.setFont = function(font, start, end) {
    if(!start)
      start = 0;
    if(!end)
      end = this.length;
    if(!this.style) 
      this.style = [];
    if(font instanceof Font)
      font = new Color(font);
    this.style.push({type:'font',value:font,start:start,end:end});
  }

  Text.prototype.setColor = function(color, start, end) {
    if(!start)
      start = 0;
    if(!end)
      end = this.length;
    if(!this.style) 
      this.style = [];
    if(color instanceof Color)
      color = new Color(color);
    this.style.push({type:'color',value:color,start:start,end:end});
  }

  // compare
  Text.prototype.valueOf = function() { return this.toString(); }

  // logging
  Text.prototype.inspect = function() { return this.toString(); }

  // other.. stuff.
  Text.prototype.toString = function() {
    return this.private.super.toString.apply(this.private.super,arguments);
  }

  return Text;

})();


/*
String.prototype.charAt()
String.prototype.charCodeAt()
String.prototype.concat()
String.prototype.indexOf()
String.prototype.lastIndexOf()
String.prototype.localeCompare()
*/

  /*
Creating an NSAttributedString Object
initWithString:
initWithAttributedString:
initWithString:attributes:
Retrieving Character Information
string
length
Retrieving Attribute Information
attributesAtIndex:effectiveRange:
attributesAtIndex:longestEffectiveRange:inRange:
attribute:atIndex:effectiveRange:
attribute:atIndex:longestEffectiveRange:inRange:
Comparing Attributed Strings
isEqualToAttributedString:
Extracting a Substring
attributedSubstringFromRange:
Enumerating over Attributes in a String
enumerateAttribute:inRange:options:usingBlock:
enumerateAttributesInRange:options:usingBlock:


Retrieving Character Information
mutableString
Changing Characters
replaceCharactersInRange:withString:
deleteCharactersInRange:
Changing Attributes
setAttributes:range:
addAttribute:value:range:
addAttributes:range:
removeAttribute:range:
Changing Characters and Attributes
appendAttributedString:
insertAttributedString:atIndex:
replaceCharactersInRange:withAttributedString:
setAttributedString:
Grouping Changes
beginEditing
endEditing








  NSString *NSFontAttributeName; // NSFont
  NSString *NSParagraphStyleAttributeName; //NSParagraphStyle
  NSString *NSForegroundColorAttributeName; //NSColor
  NSString *NSUnderlineStyleAttributeName; // integer? NSUnderlineByWordMask NSUnderlineStyleThick  NSUnderlineStyleNone   = 0x00,
                                            // NSUnderlineStyleSingle   = 0x01,
                                            // NSUnderlineStyleThick   = 0x02,
                                            // NSUnderlineStyleDouble   = 0x09
  NSString *NSSuperscriptAttributeName; // integer
  NSString *NSBackgroundColorAttributeName; // NSColor
  NSString *NSAttachmentAttributeName; // NSTextAttachment
  NSString *NSLigatureAttributeName; // 1 = standard, 0 = none, 2 = all
  NSString *NSBaselineOffsetAttributeName; // offset from baseline, float
  NSString *NSKernAttributeName; // float, default 0.0 
  NSString *NSLinkAttributeName; // NSURL
  NSString *NSStrokeWidthAttributeName; // float, default 0.0
  NSString *NSStrokeColorAttributeName; // NSColor
  NSString *NSUnderlineColorAttributeName; // NSColor
  NSString *NSStrikethroughStyleAttributeName; // // integer? NSUnderlineByWordMask NSUnderlineStyleThick  NSUnderlineStyleNone   = 0x00,
                                            // NSUnderlineStyleSingle   = 0x01,
                                            // NSUnderlineStyleThick   = 0x02,
                                            // NSUnderlineStyleDouble   = 0x09
  NSString *NSStrikethroughColorAttributeName; // NSColor
  NSString *NSShadowAttributeName; // NSShadow
  NSString *NSObliquenessAttributeName; // skew applied 0.0 -- ?
  NSString *NSExpansionAttributeName; // defaults to 0.0 --- ? 
  NSString *NSCursorAttributeName; // NSCursor
  NSString *NSToolTipAttributeName; // String
  NSString *NSMarkedClauseSegmentAttributeName;// NSNumber ?.. wtf
  NSString *NSWritingDirectionAttributeName; // ????
  NSString *NSVerticalGlyphFormAttributeName; // 0=horizontal, 1==vertical
  NSString *NSTextAlternativesAttributeName;
  */