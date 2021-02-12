var Controller = require('./lib/controller/').Controller;
var controller = new Controller();

function rotation() {
	var rotation = require("./rotations")['soulbeast']['power_longbow']

	controller.processCommands(rotation);
}


rotation();