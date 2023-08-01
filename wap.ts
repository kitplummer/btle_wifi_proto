import { init, Ditto, Document, Identity } from '@dittolive/ditto';

require('dotenv').config()
let ditto
let APP_ID = process.env.APP_ID
let OFFLINE_TOKEN = process.env.OFFLINE_TOKEN
let SHARED_KEY = process.env.SHARED_KEY
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let subscription
let liveQuery
let status: Document[] = []

process.once('SIGINT', function (code) {
    console.log('SIGINT received...');
    process.exit(0);
});

async function main () {
	console.log("Starting Ditto SmallPeer BTLE->WiFI Proto");
	await init();

	//ditto = new Ditto({ type: 'onlinePlayground', appID: APP_ID, token: APP_TOKEN})
	ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
  	ditto.setOfflineOnlyLicenseToken(OFFLINE_TOKEN)
	ditto.startSync();
	subscription = ditto.store.collection("wap").find("isDeleted == false").subscribe()
	const wap_collection = ditto.store.collection("wap")

	wap_collection.upsert({
		_id: "wap",
		ssid: "splat",
		psk: "Bl4ckH0l3L0g1"
	})

  const presenceObserver = ditto.presence.observe((graph) => {
    console.log(graph.remotePeers);
  })

}



main()

