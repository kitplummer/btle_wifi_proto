var nconf = require("nconf");
let sense = require("sense-hat-led");

import { init, Ditto, Document, Logger, TransportConfig } from '@dittolive/ditto';

nconf.argv()
  .env()
  .file({ file: 'config.json' })

const getConfig = (key: string, fallback?: any) => nconf.get(key) || fallback;
const asBoolean = (value: any) => [true, 'true', 'True', 'TRUE', '1', 1].includes(value);

const config: Record<string, any> = {
  LOG_LEVEL: getConfig('log-level', 'Info'),
  ARDUINO_SERIAL_PORT: getConfig('arduino-serial-port', '/dev/ttyACM0'),
  APP_ID: getConfig('ditto:app-id', ''),
  APP_TOKEN: getConfig('ditto:app-token', ''),
  USE_CLOUD: asBoolean(getConfig('ditto:use-cloud', true)),
  USE_LAN: asBoolean(getConfig('ditto:use-lan', true)),
  USE_BLE: asBoolean(getConfig('ditto:use-ble', true)),
};

sense.setRotation(180);

let ditto: Ditto
let presenceObserver

Logger.minimumLogLevel = config.LOG_LEVEL

let OFFLINE_TOKEN = process.env.OFFLINE_TOKEN
let SHARED_KEY = process.env.SHARED_KEY
let WAP_DEVICE_NAME = process.env.WAP_DEVICE_NAME

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
async function main() {
  console.log("Starting Ditto SmallPeer");
  await init();
  sense.clear();
  await sleep(1000);
  sense.setPixels(dittoMark);
  const transportConfig = new TransportConfig()
  config.peerToPeer.bluetoothLE.isEnabled = config.USE_BLE
  config.peerToPeer.lan.isEnabled = config.USE_LAN

  ditto = new Ditto({ type: 'onlinePlayground', appID: config.APP_ID, token: config.APP_TOKEN })
  //ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
  //  ditto.setOfflineOnlyLicenseToken(OFFLINE_TOKEN)
  const transportConditionsObserver = ditto.observeTransportConditions((condition, source) => {
    if (condition === 'BLEDisabled') {
      console.log('BLE disabled')
    } else if (condition === 'NoBLECentralPermission') {
      console.log('Permission missing for BLE')
    } else if (condition === 'NoBLEPeripheralPermission') {
      console.log('Permissions missing for BLE')
    }
  })
  ditto.setTransportConfig(transportConfig)
  ditto.startSync();

  wapSub = ditto.store.collection("wap").findByID("wap").subscribe()
  wapLiveQuery = ditto.store.collection("wap").findByID("wap").observeLocal((doc, event) => {
    wap = doc
    console.log("wap: ", wap.value)
  })

  presenceObserver = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length == 0) {
      sense.setPixel(7, 7, black)
    }
    //console.log("local peer key: ", graph.localPeer.peerKey)
    console.log("local peer connections: ", graph.localPeer.connections)
    sense.setPixel(7, 0, black)
    sense.setPixel(7, 7, black)
    graph.localPeer.connections.forEach((peer) => {
      //console.log("remote peer: ", peer.peer2)
      switch (peer['connectionType']) {
        case "AccessPoint":
          sense.setPixel(7, 0, green)
        case "Bluetooth":
          sense.setPixel(7, 7, blue)
      }
    })
  })

}

main()

