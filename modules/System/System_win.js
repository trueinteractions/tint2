module.exports = (function() {
  var $ = process.bridge.dotnet;
  var Screens = require('Screens');
  var utils = require('Utilities');
  var path = require('path');
  var $w32 = process.bridge.win32;

  process.bridge.dotnet.import('Microsoft.VisualBasic.dll');

  function System() {}

  System.getIconForFile = function(e) {
    return "data:image/png;base64," + $.TintInterop.Shell.GetIconForFile(e);
  }

  function keyCodeFromChar(keyString) {
    var keys = {
      '\b':0x0008,
      '\t':0x0009,
      'TAB':0x0009,
      '\n':0x000D,
      'SHIFT':0x0010,
      'CONTROL':0x0011,
      'ALT':0x0012,
      'CAPSLOCK':0x0014,
      'PAUSE':0x0013,
      'ESC':0x001B,
      ':':0x0020,
      'PGUP':0x0021,
      'PGDN':0x0022,
      'UP':0x0026,
      'DOWN':0x0028,
      'DEL':0x002E,
      '0':0x0030,
      '1':0x0031,
      '2':0x0032,
      '3':0x0033,
      '4':0x0034,
      '5':0x0035,
      '6':0x0036,
      '7':0x0037,
      '8':0x0038,
      '9':0x0039,
      'a':0x0041,
      'b':0x0042,
      'c':0x0043,
      'd':0x0044,
      'e':0x0045,
      'f':0x0046,
      'g':0x0047,
      'h':0x0048,
      'i':0x0049,
      'j':0x004A,
      'k':0x004B,
      'l':0x004C,
      'm':0x004D,
      'n':0x004E,
      'o':0x004F,
      'p':0x0050,
      'q':0x0051,
      'r':0x0052,
      's':0x0053,
      't':0x0054,
      'u':0x0055,
      'v':0x0056,
      'w':0x0057,
      'x':0x0058,
      'y':0x0059,
      'z':0x005A,
      '*':0x006A,
      '+':0x006B,
      ',':0x006C,
      '-':0x006D,
      '.':0x006E,
      '/':0x006F,
      'F1':0x0070,
      'F2':0x0071,
      'F3':0x0072,
      'F4':0x0073,
      'F5':0x0074,
      'F6':0x0075,
      'F7':0x0076,
      'F8':0x0077,
      'F9':0x0078,
      'F10':0x0079,
      'F11':0x007A,
      'F12':0x007B,
      'LSHIFT':0x00A0,
      'RSHIFT':0x00A1,
      'LCONTROL':0x00A2,
      'RCONTROL':0x00A3,
      'LALT':0x00A4,
      'RALT':0x00A5,
      '?':0x00BF,
      '~':0x00C0,
      '[':0x00DB,
      '\\':0x00DC,
      ']':0x00DD,
      '"':0x00DE,
      '!':0x00DF,
      '<':0x00E2,
      'RETURN':0x000D
    };
    return keys[keyString];
  };

  function getBoundsOnScreenOfWPFItem(control) {
    var target = $.System.Windows.Window.GetWindow(control);
    if(target === null) {
      return null;
    }
    var bounds = control.TransformToVisual(target).TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(control));
    var p = utils.wpfDeviceToLogicalPx(target,control.PointToScreen(new $.System.Windows.Point(0,0)));
    return {x:Math.round(p.X), y:Math.round(p.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
  }
  function convertFormat(inType) {
    switch(inType.toLowerCase()) {
      case 'html':
        return $.System.Windows.DataFormats.Html;
      case 'rtf':
        return $.System.Windows.DataFormats.Rtf;
      case 'ascii':
        return $.System.Windows.DataFormats.Text;
      case 'bitmap':
      case 'image':
        return $.System.Windows.DataFormats.Bitmap;
      case 'tiff':
        return $.System.Windows.DataFormats.Tiff;
      case 'audio':
        return $.System.Windows.DataFormats.WaveAudio;
      case 'text':
        return $.System.Windows.DataFormats.UnicodeText;
      default:
        return inType;
        break;
    }
  }
  System.clipboardClear = function() {
    $.System.Windows.Clipboard.Clear();
    $.System.Windows.Clipboard.Flush();
  }
  System.clipboardContainsType = function(e) {
    return $.System.Windows.Clipboard.ContainsData(convertFormat(e));
  }
  System.clipboardGet = function(type) {
    if(type) {
      return $.System.Windows.Clipboard.GetData(convertFormat(type));
    }
    return $.System.Windows.Clipboard.GetText();
  }
  System.clipboardSet = function(data, type) {
    if(type) {
      return {release:function() { /* dummy function */ }, native:$.System.Windows.Clipboard.SetData(convertFormat(type), data)};
    }
    return {release:function() { /* dummy function */ }, native:$.System.Windows.Clipboard.SetText(data.toString())};
  }
  
  Object.defineProperty(System, 'home', {
    get:function() { return $.System.Environment.ExpandEnvironmentVariables("%HOMEDRIVE%%HOMEPATH%").toString(); }
  });
  function toWindows(file) {
    file = file.replace(/\//g, "\\").replace("~", System.home);
    return file; 
  }
  System.showFile = function(file) {
    file = toWindows(file);
    var dir = path.dirname(file);
    $.System.Diagnostics.Process.Start(dir);
  };
  System.openFile = function(file) {
    file = toWindows(file);
    $.System.Diagnostics.Process.Start(file);
  };
  System.openURL = function(url) {
    $.System.Diagnostics.Process.Start(url);
  };
  System.trashFile = function(file) {
    file = toWindows(file);
    $.Microsoft.VisualBasic.FileIO.FileSystem.DeleteFile(file, 
      $.Microsoft.VisualBasic.FileIO.UIOption.AllDialogs,
      $.Microsoft.VisualBasic.FileIO.RecycleOption.SendToRecycleBin);
  };
  System.beep = function() {
    $.System.Media.SystemSounds.Beep.Play();
  };

  Object.defineProperty(System, 'mousePosition', {
    get:function() {
      var val = process.bridge.ref.alloc($w32.user32.LPPOINT);
      $w32.user32.GetCursorPos(val);
      var sf = Screens.active.scaleFactor;
      var x = val.readUInt32LE(0);
      var y = val.readUInt32LE(4);
      return {x:x/sf, y:y/sf};
    }
  });

  System.sendKey = System.keyAtControl = function(input) {
    var key = keyCodeFromChar(input);
    $w32.user32.keybd_event(key, 0, 0, 0);
    $w32.user32.keybd_event(key, 0, 0x0002, 0);
  };

  System.rightClickAtControl = function(control) {
    var z = control.boundsOnScreen;
    return this.rightClickAt(Math.round(z.x + z.width/2) ,Math.round(z.y + z.height/2));
  };

  System.scrollAt = function(x, y, upOrDown) {
    this.clickAt(x,y);
    if(upOrDown > 0) {
      System.keyAtControl('UP');
      System.keyAtControl('UP');
      System.keyAtControl('UP');
      System.keyAtControl('UP');
      System.keyAtControl('UP');
      System.keyAtControl('UP');
    }
    else {
      System.keyAtControl('DOWN');
      System.keyAtControl('DOWN');
      System.keyAtControl('DOWN');
      System.keyAtControl('DOWN');
      System.keyAtControl('DOWN');
      System.keyAtControl('DOWN');
    }
  };

  System.scrollAtControl = function(control, upOrDown) {
    var z = control.boundsOnScreen;
    this.scrollAt(Math.round(z.x + z.width/2) ,Math.round(z.y + z.height/2),upOrDown);
  };

  System.clickAtControl = function(control) {
    var bounds;
    // If we pass in a Tint control, get the bounding box.
    if(control.native) {
      bounds = control.boundsOnScreen;
    // If we pass in a WPF control, get the bounding box.
    } else {
      bounds = getBoundsOnScreenOfWPFItem(control);
    }
    return this.clickAt(Math.round(bounds.x + bounds.width/2) ,Math.round(bounds.y + bounds.height/2));
  };

  System.mouseDownAt = function(x,y) {
    var dpi = Screens.active.scaleFactor;
    $w32.user32.ShowCursor(0); // On VM's we need to turn off the cursor
    $w32.user32.SetPhysicalCursorPos(Math.round(x*dpi),Math.round(y*dpi));
    $w32.user32.ShowCursor(1);
    $w32.user32.mouse_event(0x0008, 0, 0, 0, 0); //RMOUSEDOWN
  }

  System.mouseUpAt = function(x,y) {
    var dpi = Screens.active.scaleFactor;
    $w32.user32.ShowCursor(0); // On VM's we need to turn off the cursor
    $w32.user32.SetPhysicalCursorPos(Math.round(x*dpi),Math.round(y*dpi));
    $w32.user32.ShowCursor(1);
    $w32.user32.mouse_event(0x0010, 0, 0, 0, 0); //RMOUSEUP
  }

  System.clickAt = function(x,y) {
    var dpi = Screens.active.scaleFactor;
    var w = Screens.active.bounds.width;
    var h = Screens.active.bounds.height;
    $w32.user32.ShowCursor(0); // On VM's we need to turn off the cursor
    $w32.user32.SetPhysicalCursorPos(Math.round(x*dpi),Math.round(y*dpi));
    $w32.user32.ShowCursor(1);
    $w32.user32.mouse_event(0x8000|0x0001, Math.round(((x/w))*65535), Math.round(((y/h))*65535), 0, 0);  //MOUSEMOVE 
    $w32.user32.mouse_event(0x8000|0x0002, Math.round(((x/w))*65535), Math.round(((y/h))*65535), 0, 0);  //LMOUSEDOWN 
    $w32.user32.mouse_event(0x8000|0x0004, Math.round(((x/w))*65535), Math.round(((y/h))*65535), 0, 0); //LMOUSEUP
  };

  System.rightClickAt = function(x,y) {
    var dpi = Screens.active.scaleFactor;
    $w32.user32.ShowCursor(0); // On VM's we need to turn off the cursor
    $w32.user32.SetPhysicalCursorPos(Math.round(x*dpi),Math.round(y*dpi));
    $w32.user32.ShowCursor(1);
    $w32.user32.mouse_event(0x0008, 0, 0, 0, 0); //RMOUSEDOWN
    $w32.user32.mouse_event(0x0010, 0, 0, 0, 0); //RMOUSEUP
  };

  System.takeSnapshotOfActiveScreen = function() {
    var scaleFactor = 1; // don't use a scalefactor as we're dealing with winforms 100%.
    var ix = Math.round($.System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.X * scaleFactor);
    var iy = Math.round($.System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.Y * scaleFactor);
    var iw = Math.round($.System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.Width * scaleFactor);
    var ih = Math.round($.System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.Height * scaleFactor);
    var image = new $.System.Drawing.Bitmap(iw, ih, $.System.Drawing.Imaging.PixelFormat.Format32bppArgb);
    var g = $.System.Drawing.Graphics.FromImage(image);
    g.CopyFromScreen(ix, iy, ix, iy, new $.System.Drawing.Size(iw, ih), $.System.Drawing.CopyPixelOperation.SourceCopy);
    var mem = new $.System.IO.MemoryStream();
    image.Save(mem, $.System.Drawing.Imaging.ImageFormat.Png);
    return mem.ToArray().toString('base64');
  };

  System.takeSnapshotOfTopWindow = function() {
    var hwnd = $w32.user32.GetForegroundWindow();
    var topRect = new $w32.structs.RECT();
    $w32.user32.GetWindowRect(hwnd,topRect.ref());
    var iw = Math.round(topRect.right - topRect.left);
    var ih = Math.round(topRect.bottom - topRect.top);
    var myImage = new $.System.Drawing.Bitmap(iw, ih);
    var gr1 = $.System.Drawing.Graphics.FromImage(myImage);
    var dc1 = gr1.GetHdc();
    var dc2 = $w32.user32.GetWindowDC(hwnd);
    $w32.gdi32.BitBlt(dc1.pointer.rawpointer, 0, 0, iw, ih, dc2, 0, 0, 0x00cc0020);
    gr1.ReleaseHdc(dc1);
    var mem = new $.System.IO.MemoryStream();
    myImage.Save(mem, $.System.Drawing.Imaging.ImageFormat.Png);
    return mem.ToArray().toString('base64');
  };

  System.takeSnapshotOfWindowNumber = function(windowNumber) {
    var windows = $.System.Windows.Application.Current.Windows;
    var count = windows.Count;
    for(var i=0; i < count; i++) {
      var item = windows.Item(i);
      if(i === windowNumber) {
        return this.takeSnapshotOfWindow(item);
      }
    }
  };

  System.takeSnapshotOfCurrentWindow = function() {
    var windows = $.System.Windows.Application.Current.Windows;
    var count = windows.Count;
    for(var i=0; i < count; i++) {
      var item = windows.Item(i);
      if(item.IsActive) {
        return this.takeSnapshotOfWindow(item);
      }
    }
  };

  System.takeSnapshotOfWindow = function(windowObj) {
    if(windowObj.native) {
      windowObj = windowObj.native;
    }
    var scaleFactor = $.System.Windows.SystemParameters.Dpi/96;
    var hwnd = (new $.System.Windows.Interop.WindowInteropHelper(windowObj)).EnsureHandle();
    var ix = 0;
    var iy = 0;
    var iw = Math.round(windowObj.Width * scaleFactor);
    var ih = Math.round(windowObj.Height * scaleFactor);
    var myImage = new $.System.Drawing.Bitmap(iw, ih);
    var gr1 = $.System.Drawing.Graphics.FromImage(myImage);
    var dc1 = gr1.GetHdc();
    var dc2 = $w32.user32.GetWindowDC(hwnd.pointer.rawpointer);
    $w32.gdi32.BitBlt(dc1.pointer.rawpointer, ix, iy, iw, ih, dc2, 0, 0, 0x00cc0020);
    gr1.ReleaseHdc(dc1);
    var mem = new $.System.IO.MemoryStream();
    myImage.Save(mem, $.System.Drawing.Imaging.ImageFormat.Png);
    return mem.ToArray().toString('base64');
  };

  System.takeSnapshotOfControl = function(c) {
    if(c.native) {
      c = c.native;
    }
    var rtb = new $.System.Windows.Media.Imaging.RenderTargetBitmap(
      Math.ceil(c.RenderSize.Width), 
      Math.ceil(c.RenderSize.Height),
      96.00000000001, 
      96.00000000001, 
      $.System.Windows.Media.PixelFormats.Pbgra32);
      var sourceBrush = new $.System.Windows.Media.VisualBrush(c);
      var drawingVisual = new $.System.Windows.Media.DrawingVisual();
      var drawingContext = drawingVisual.RenderOpen();
      drawingContext.DrawRectangle(sourceBrush, 
        new $.System.Windows.Media.Pen(), 
        new $.System.Windows.Rect(new $.System.Windows.Point(0,0), new $.System.Windows.Point(c.RenderSize.Width,c.RenderSize.Height)));
      
      drawingContext.Close();
      rtb.Render(drawingVisual);
      var png = new $.System.Windows.Media.Imaging.PngBitmapEncoder();
      png.Frames.Add($.System.Windows.Media.Imaging.BitmapFrame.Create(rtb));
      var stm = new $.System.IO.MemoryStream();
      png.Save(stm);
      return stm.ToArray().toString('base64');
  };

  return System;
})();