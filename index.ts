var sense = require("sense-hat-led");
import { init, Ditto, Document, Identity } from '@dittolive/ditto';
require('dotenv').config()

sense.setRotation(180);

let ditto
let APP_ID = process.env.APP_ID
let OFFLINE_TOKEN = process.env.OFFLINE_TOKEN
let SHARED_KEY = process.env.SHARED_KEY

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
let wapSub
let wapLiveQuery
let status: Document[] = []
let wap: Document

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
  	ditto.setOfflineOnlyLicenseToken(OFFLINE_TOKEN)
	ditto.startSync();

  	wapSub = ditto.store.collection("wap").findByID("wap").subscribe()
  	wapLiveQuery = ditto.store.collection("wap").findByID("wap").observeLocal((doc, event) => {
    	wap = doc
    	console.log("wap: ", wap)
  })

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

