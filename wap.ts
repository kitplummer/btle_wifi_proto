import { init, Ditto, Document, Identity } from '@dittolive/ditto';

require('dotenv').config()
let ditto
let APP_ID = process.env.APP_ID
let OFFLINE_TOKEN = process.env.OFFLINE_TOKEN
let SHARED_KEY = process.env.SHARED_KEY
let APP_TOKEN = process.env.APP_TOKEN

//let subscription
let joysticks: Document[] = []
let joystickSubscription
let joystickLiveQuery

process.once('SIGINT', function (code) {
    console.log('SIGINT received...');
    process.exit(0);
});

async function main () {
	console.log("Starting Ditto SmallPeer BTLE->WiFI Proto");
	await init();

	ditto = new Ditto({ type: 'onlinePlayground', appID: APP_ID, token: APP_TOKEN})
	//ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
//  	ditto.setOfflineOnlyLicenseToken(OFFLINE_TOKEN)
	ditto.startSync();

  joystickSubscription = ditto.store.collection("joystick").find("isDeleted == false && isCompleted == false").subscribe()
  joystickLiveQuery = ditto.store.collection("joystick").find("isDeleted == false && isCompleted == false").observeLocal((docs, event) => {
	joysticks = docs
	joysticks.forEach((doc) => {
	  console.log("completing: ", doc.value._id)
	  ditto.store.collection("joystick").upsert({
		_id: doc.value._id,
		isCompleted: true
	  })
	})
  })
  
//	subscription = ditto.store.collection("wap").find("_id == wap").subscribe()
	const wap_collection = ditto.store.collection("wap")

	wap_collection.upsert({
		_id: "wap",
		ssid: "dittox",
		psk: "bahhh"
	})

  const presenceObserver = ditto.presence.observe((graph) => {
//    console.log(graph.remotePeers);
  })

}



main()

