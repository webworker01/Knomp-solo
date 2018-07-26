var Stratum = require('../stratum/index.js');
var timestamp = require('../modules/timestamp.js');
var api = require('../modules/api.js');
var logging = require('../modules/logging.js');

var net = require('net');
var fs = require('fs');
var path = require('path');

module.exports = function () {
	var _this = this;

	var config = JSON.parse(process.env.config);
	var forkId = process.env.forkId;

	function authorizeFN(ip, port, workerName, password, callback) {
		logging("PoolWorker", "special", "Authorized " + workerName + ":" + password + "@" + ip, forkId);
		callback({
			error: null,
			authorized: true,
			disconnect: false
		});
	}

	var pool = Stratum.createPool(config, authorizeFN);
	pool.start();

	pool.on('share', function (isValidShare, isValidBlock, data) {
		if (isValidBlock) {
			logging('Blocks', 'special', 'Block found: ' + data.height + ' Hash: ' + data.blockHash + ' block Diff: ' + data.blockDiff);

			api('block', {
				block: data.height,
				finder: data.worker,
				date: new Date().getTime()
			});
		} else if (isValidShare) {
			logging('Blocks', 'special', 'Invalid Low Diff Block Found - Block diff: ' + data.blockDiffActual + ' Found Diff: ' + data.shareDiff, forkId);
		} else if (data.blockHash) {
			logging('PoolWorker', 'error', 'We thought a block was found but it was rejected by the daemon', forkId)
		}
	});

	pool.on('log', function (severity, logKey, logText) {
		//console.log(logging.severityToColor(severity, '[Thread ' + forkId + '][' + timestamp() + '] ' + logKey));
		logging('PoolWorker', 'debug', logKey, forkId);
	});
}