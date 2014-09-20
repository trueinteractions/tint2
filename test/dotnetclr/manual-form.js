require('Bridge');
$ = process.bridge.dotnet;
$.import("System.Windows.Forms");
$.import("System.Drawing");
var Form = $.System.Windows.Forms.Form;
var Button = $.System.Windows.Forms.Button;
var Point = $.System.Drawing.Point;


// Create a new instance of the form.
var form1 = new Form();
// Create two buttons to use as the accept and cancel buttons.
var button1 = new Button ();
var button2 = new Button ();

// Set the text of button1 to "OK".
button1.Text = "OK";
// Set the position of the button on the form.
button1.Location = new Point(10,10);
// Set the text of button2 to "Cancel".
button2.Text = "Cancel";
// Set the position of the button based on the location of button1.
button2.Location = new Point (button1.Left, button1.Height + button1.Top + 10);
// Set the caption bar text of the form.   
form1.Text = "My Dialog Box";
// Display a help button on the form.
form1.HelpButton = true;
// Define the border style of the form to a dialog box.
form1.FormBorderStyle = $.FormBorderStyle.FixedDialog;
// Set the MaximizeBox to false to remove the maximize box.
form1.MaximizeBox = false;
// Set the MinimizeBox to false to remove the minimize box.
form1.MinimizeBox = false;
// Set the accept button of the form to button1.
form1.AcceptButton = button1;
// Set the cancel button of the form to button2.
form1.CancelButton = button2;
// Set the start position of the form to the center of the screen.
form1.StartPosition = $.FormStartPosition.CenterScreen;
// Add button1 to the form.
form1.Controls.Add(button1);
// Add button2 to the form.
form1.Controls.Add(button2);
// Display the form.
// Note, ShowDialog will block since it's Modal
form1.Show();



