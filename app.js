var Controller = require('./lib/controller/').Controller;
var controller = new Controller();

function rotation() {
	var rotation = require("./rotations")['weaver']['staffWithFireGlyph']

	controller.processCommands(rotation);
}


rotation();