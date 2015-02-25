
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
 * @see {Notification}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  mainWindow.visible = true;
  var input = new TextInput();
  mainWindow.appendChild(input);
  input.left=input.top=0;
  input.width = 200;
  input.textcolor = 'rgba(255,0,0,1);';
  input.font = new Font('Times New Roman', 25);
  input.value = "Testing";
  input.height = 25 * 1.5;

  setTimeout(function() {
    $utils.assert(input.textcolor.red === 1, 'expected red == 1 got: ', input.textcolor);
    $utils.assert(input.textcolor.green === 0);
    $utils.assert(input.textcolor.blue === 0);
    $utils.assert(input.textcolor.alpha === 1);
    $utils.assert(input.font.family === "Times New Roman", "Font family was incorrect, should be Times New Roman, was ["+input.font.family+"]");
    $utils.assert(input.font.italic === false);
    $utils.assert(input.font.bold === false);
    $utils.assert(input.font.size === 25);
    // TODO: Mac standardizes its default weight to "400", windows uses "500"... why?.
    // $utils.assert(input.font.weight === 500, 'weight was: '+input.font.weight);
    $utils.ok();
  },750);
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
  name:"FontStyles",
};