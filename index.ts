var sense = require("sense-hat-led");
import { init, Ditto, Document, Identity } from '@dittolive/ditto';
require('dotenv').config()

import { SenseHat } from 'pi-sense-hat'

let senseHat = new SenseHat()


sense.setRotation(180);

let ditto

let APP_ID = process.env.APP_ID
let OFFLINE_TOKEN = process.env.OFFLINE_TOKEN
let SHARED_KEY = process.env.SHARED_KEY
let WAP_DEVICE_NAME = process.env.WAP_DEVICE_NAME
let APP_TOKEN = process.env.APP_TOKEN

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

let wapSub
let wapLiveQuery

let wap: Document
let wapSSID
let wapPSK

let joystickSubscription
let joystickLiveQuery
let joysticks: Document[] = []

process.once('SIGINT', async () => {
    try {
      sense.clear()
      await sleep(500)
    } finally {
      console.log('SIGINT received...')
      process.exit(0)
    }
});
 

// sudo nmcli d wifi connect dittox password MyWiFiPassword
// sudo nmcli con down id dittox 
async function main () {
	console.log("Starting Ditto SmallPeer");
	await init();
	sense.clear();
	await sleep(1000);
	sense.setPixels(dittoMark);

	ditto = new Ditto({ type: 'onlinePlayground', appID: APP_ID, token: APP_TOKEN})
	//ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
//  ditto.setOfflineOnlyLicenseToken(OFFLINE_TOKEN)
	ditto.startSync();

  wapSub = ditto.store.collection("wap").findByID("wap").subscribe()
  wapLiveQuery = ditto.store.collection("wap").findByID("wap").observeLocal((doc, event) => {
    wap = doc
    console.log("wap: ", wap.value)
  })

  joystickSubscription = ditto.store.collection("joystick").find("isDeleted == false").subscribe()
  joystickLiveQuery = ditto.store.collection("joystick").find("isDeleted == false").observeLocal((docs, event) => {
    joysticks = docs
	  //console.log("JS docs: ", joysticks)
  })

  const presenceObserver = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length == 0) {
      sense.setPixel(7, 7, black)
    }
    //console.log("local peer key: ", graph.localPeer.peerKey)
    //console.log("local peer connections: ", graph.localPeer.connections)
    sense.setPixel(7, 0, black)
    sense.setPixel(7, 7, black)
    graph.localPeer.connections.forEach((peer) => {
      //console.log("remote peer: ", peer.peer2)
      switch(peer['connectionType']) {
        case "AccessPoint":
          sense.setPixel(7, 0, green)
        case "Bluetooth":
          sense.setPixel(7, 7, blue)
      }
    })
  })

  senseHat.on("joystick", (message)=>{
    //console.log("joystick event received:", JSON.stringify(message,null,2))
    console.log("js event:", message["key"], message["state"])
    ditto.store.collection("joystick").upsert({
	    event: message["key"],
      state: message["state"],
	    isCompleted: false,
      isDeleted: false
    })
  })
}

main()

