import { init, Ditto, Document, TransportConfig } from '@dittolive/ditto';

let nconf = require('nconf')

nconf.argv()
  .env()
  .file({ file: "./config.json" })


let ditto: Ditto
let APP_ID = nconf.get('ditto:APP_ID')
let OFFLINE_TOKEN = process.env.OFFLINE_TOKEN
let SHARED_KEY = process.env.SHARED_KEY
let APP_TOKEN = nconf.get('ditto:APP_TOKEN')

let presenceObserver

process.once('SIGINT', function(code) {
  console.log('SIGINT received...');
  process.exit(0);
});

async function main() {
  console.log("Starting Ditto SmallPeer BTLE->WiFI Proto");
  await init();
  const transportConfig = new TransportConfig()

  transportConfig.peerToPeer.bluetoothLE.isEnabled = true
  transportConfig.peerToPeer.lan.isEnabled = true

  //ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
  //  ditto.setOfflineOnlyLicenseToken(OFFLINE_TOKEN)
  ditto = new Ditto({ type: 'onlinePlayground', appID: APP_ID, token: APP_TOKEN })
  //ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
  //  	ditto.setOfflineOnlyLicenseToken(OFFLINE_TOKEN)
  ditto.startSync();

  //	subscription = ditto.store.collection("wap").find("_id == wap").subscribe()
  const wap_collection = ditto.store.collection("wap")

  wap_collection.upsert({
    _id: "wap",
    ssid: "dittox",
    psk: "bahhh"
  })

  presenceObserver = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length > 0) {
      graph.remotePeers.forEach(peer => {
        console.log(`peer: ${peer.deviceName}`);
      })
    }
  })

}



main()

