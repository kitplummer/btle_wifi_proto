var sense = require("sense-hat-led");
import { init, Ditto, Document, Identity } from '@dittolive/ditto';

sense.setRotation(180);

let ditto
let APP_ID = "09fcd60d-69d2-414d-bc66-9c2475077258"
let APP_TOKEN = "aa73cec6-ac1c-4989-8749-94450106cc9d"
let SHARED_KEY = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgKhIg22ewaiO6135nDGwy3Yh78g6x6em1gEZhYNoWVRuhRANCAASeuOoqVE6/0VJeOA/s9rAIHhtuY9nIP+rBkJSC/BxZ1xSnDsxVaSevTSYni64XH/HNd7Yu8mipTIs47SKWiUKG"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let red = [255, 0, 0]
let blue = [0, 0, 255]
let gray = [192, 192, 192]
let black = [0, 0, 0]
let green = [124, 252, 0]
let X = blue;  // Red
let O = black;
let dittoMark = [
O, O, O, O, O, O, O, O,
X, X, O, X, X, O, O, O,
O, X, X, O, X, X, O, O,
O, O, X, X, O, X, X, O,
O, O, O, X, X, O, X, X,
O, O, X, X, O, X, X, O,
O, X, X, O, X, X, O, O,
X, X, O, X, X, O, O, O
];

let subscription
let liveQuery
let status: Document[] = []

process.once('SIGINT', function (code) {
    sense.clear();
    console.log('SIGINT received...');
    process.exit(0);
});

async function main () {
	sense.clear();
	console.log("Starting Ditto SmallPeer");
	await sleep(1000);
	await init();
	sense.clear(blue);
	await sleep(1000);
	sense.clear();
	await sleep(1000);
	sense.setPixels(dittoMark);

	//ditto = new Ditto({ type: 'onlinePlayground', appID: APP_ID, token: APP_TOKEN})
	ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
	ditto.startSync();
	subscription = ditto.store.collection("status").find("isDeleted == false").subscribe()
	liveQuery = ditto.store.collection("status").find("isDeleted == false").observeLocal((docs, event) => {
		status = docs
		
		console.log("status: ", status.map((state) => state.value)[0]);
		let record = status.map((state) => state.value)[0];
		if (record.status) {
			sense.setPixel(7, 0, green);
		} else {
			sense.setPixel(7, 0, red);
		}
  	})
}

main()

