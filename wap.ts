import { init, Ditto, Document, Identity } from '@dittolive/ditto';

let ditto
let APP_ID = "09fcd60d-69d2-414d-bc66-9c2475077258"
let APP_TOKEN = "aa73cec6-ac1c-4989-8749-94450106cc9d"
let SHARED_KEY = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgKhIg22ewaiO6135nDGwy3Yh78g6x6em1gEZhYNoWVRuhRANCAASeuOoqVE6/0VJeOA/s9rAIHhtuY9nIP+rBkJSC/BxZ1xSnDsxVaSevTSYni64XH/HNd7Yu8mipTIs47SKWiUKG"
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

	ditto = new Ditto({ type: 'onlinePlayground', appID: APP_ID, token: APP_TOKEN})
	//ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
	ditto.startSync();
	subscription = ditto.store.collection("wap").find("isDeleted == false").subscribe()
	const wap_collection = ditto.store.collection("wap")

	wap_collection.upsert({
		_id: "SeedsCafe1",
		_pk: "SeedsCafe1"
	})

  const presenceObserver = ditto.presence.observe((graph) => {
    console.log(graph.remotePeers);
  })

}



main()

