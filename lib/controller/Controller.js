var robot = require('robotjs');
var ioHook = require('iohook');
var keycodes = require('./keycodes.js');
var debug = require('debug')('controller');
// begin ioHook listener
	ioHook.start();

// Whenever we wait to wait between actions, we use this millsecond value
const LONG_DELAY = 750;
const SHORT_DELAY = 100;

/*
	Promise prototyping
*/

// In order to handle delays between actions, we need to create a special delay function.
function delay(time, value) {
	return new Promise( (resolve) => {
		setTimeout( resolve.bind(null, value), time);
	})
}
// for this example, we will prototype it onto Promise itself
Promise.prototype.delay = function(time) {
	return this.then( (value) => {
		return delay(time, value);
	})
}

function killswitch(value) {
	debug('Registering killswitch [END]...');
	return new Promise( (resolve) => {

		ioHook.once('keydown', (keypress) => {
			// 'end' is 61007 to terminate process
			if(keypress.keycode == '61007') { 
				console.log('[TERMINATE PROCESS] The terminate process key was pressed')
				process.exit(0);
			}
		})
		resolve();
	})

}

Promise.prototype.killswitch = function() {
	return this.then( (value) => {
		return killswitch(null, value);
	})
}

// in accordance to arena net's 'one keypress, one action, this function has been built out to wait for a keypress before it continues to the next
// action
function keypress(command, value) {
	debug('Awaiting keypress to continue the process...');
	return new Promise( (resolve) => {
		console.log(`[${command.key}] ${command.name}`);
		function eventHandler() {
			ioHook.once('keydown', (keypress) => {
				if(keypress.keycode == keycodes[command.key]) {
					debug('Resolving keypress...');
					resolve.bind(null, value)
					resolve();
				} else {
					debug(`Unrecognized action for key ${keypress.keycode}.`);
					eventHandler();
				}
			})
		}
		eventHandler();
	})
}

// for this example, we will prototype it onto Promise itself
Promise.prototype.keypress = function(command) {
	return this.then( (value) => {
		return keypress(command, value);
	})
}

/*
	Base controller
*/

// controller is the base driver for moving the mouse and providing inputs with mouse and keyboard
function Controller() {}

Controller.prototype.processCommand = async function(command,cb) {
	//
	keypress(command)
	//.delay(100)
	.then( async () => {
		await new Promise( (resolve,reject) => {
			cb(null,true);
		})
	})
}

Controller.prototype.processOpening = async function(commands,cb) {
	for (var i = 0; i < commands.length; i++) {
		await new Promise( (resolve) => {
			this.processCommand(commands[i], () => {
				debug(`${commands.length - i - 1} commands remaining...`);
				resolve();
			})
		})
		.catch( (error) => {
			console.log(error);
		})
	}

	cb(null,true);
}

Controller.prototype.processRotation = async function(commands) {
	for (var i = 0; i < commands.length; i++) {
		await new Promise( (resolve) => {
			this.processCommand(commands[i], () => {
				debug(`${commands.length - i - 1} commands remaining...`);
				// if we are at the end of our rotation chain
				if(i == commands.length - 1) {
					console.log('Beginning new rotation...');
					// set it immediately to -1, NOT zero. This is important because it will IMMEDIATELY increment at the end of the loop
					i = -1;
				}
				resolve();
			})
		})
		.catch( (error) => {
			console.log(error);
		})
	}	
}

Controller.prototype.processCommands = async function(commands) {
	await new Promise( (resolve,reject) => {
		this.processOpening(commands.opening, () => {
			resolve();
		});
	})
	.then( async () => {
		await new Promise( (resolve,reject) => {
			this.processRotation(commands.rotation);
		})
	})
}

module.exports = Controller;