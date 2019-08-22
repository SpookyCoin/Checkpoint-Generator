const CSV = require("export-to-csv"),
	  fs = require('fs'),
	  TurtleCoind = require('turtlecoin-rpc').TurtleCoind;

const daemon = new TurtleCoind({
	host: 'spookypool.nl', // ip address or hostname of the SpookyCoin node host
	port: 11421, // what port is the RPC server running on
	timeout: 30000, // request timeout
	ssl: false // whether we need to connect using SSL/TLS
});

const checkpointEveryBlocks = 50; // Save checkpoint for ever x amount of blocks

const csv_options = {
	fieldSeparator: ',',
	quoteStrings: '"',
	decimalSeparator: '.',
	showLabels: false,
	showTitle: false,
	title: '',
	useTextFile: false,
	useBom: true,
	useKeysAsHeaders: false
};

const csvExporter = new CSV.ExportToCsv(csv_options);

class Checkpoint {
	constructor(height, hash) {
		this.height = height;
		this.hash = hash;
	}
}

var checkpoints = [];

daemon.getBlockCount().then(async (height) => {
	await console.log("Got blockheight " + height + "!");

	for (let i = checkpointEveryBlocks; i < height; i += checkpointEveryBlocks) {
		await console.log("Getting block info for height " + i);
		await checkpoints.push(new Checkpoint(i, await daemon.getBlockHash({
			height: i+1
		})));
	}

	console.log("Checkpoints:\n" + JSON.stringify(checkpoints, null , 4));
	let csvdata = await csvExporter.generateCsv(checkpoints, true);
	
	csvdata = csvdata.split('"').join('');

	await fs.writeFileSync('checkpoints.csv', csvdata);
	await console.log("New checkpoints.csv file has been written!");
});
