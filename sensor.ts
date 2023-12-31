var nconf = require("nconf");
let sense = require("sense-hat-led");

import { init, Ditto, Document, Identity, Logger, TransportConfig } from '@dittolive/ditto';
import { warn } from 'console';
import { wrap } from 'module';

nconf.argv()
  .env()
  .file({ file: 'config.json' })

const getConfig = (key: string, fallback?: any) => nconf.get(key) || fallback;
const asBoolean = (value: any) => [true, 'true', 'True', 'TRUE', '1', 1].includes(value);


sense.setRotation(180);

let ditto: Ditto
let presenceObserver
let identity: Identity


Logger.minimumLogLevel = getConfig('log-level', 'Info')

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
let rawSub
let rawLiveQuery

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
  const config: Record<string, any> = {
    ARDUINO_SERIAL_PORT: getConfig('arduino-serial-port', '/dev/ttyACM0'),
    APP_ID: getConfig('ditto:app-id', ''),
    APP_TOKEN: getConfig('ditto:app-token', ''),
    SHARED_KEY: getConfig('ditto:shared-key', ''),
    OFFLINE_TOKEN: getConfig('ditto:offline-token', ''),
    USE_CLOUD: asBoolean(getConfig('ditto:use-cloud', true)),
    USE_LAN: asBoolean(getConfig('ditto:use-lan', true)),
    USE_BLE: asBoolean(getConfig('ditto:use-ble', true)),
    BPA_URL: getConfig('ditto:bpa-url', ''),
  };

  console.log("Starting Ditto SmallPeer");
  await init();
  sense.clear();
  await sleep(1000);
  sense.setPixels(dittoMark);

  const authHandler = {
    authenticationRequired: async function(authenticator) {
      await authenticator.loginWithToken("full_access", "dummy-provider")
      console.log(`Login requested`);

    },
    authenticationExpiringSoon: function(authenticator, secondsRemaining) {
      console.log(`Auth token expiring in ${secondsRemaining} seconds`)
    }
  }

  const transportConfig = new TransportConfig()
  transportConfig.peerToPeer.bluetoothLE.isEnabled = config.USE_BLE
  transportConfig.peerToPeer.lan.isEnabled = config.USE_LAN

  if (config.BPA_URL == "NA") {
    identity = {
      type: 'sharedKey',
      appID: config.APP_ID,
      sharedKey: config.SHARED_KEY
    }

  } else {
    identity = {
      type: 'onlineWithAuthentication',
      appID: config.APP_ID,
      enableDittoCloudSync: false,
      authHandler: authHandler,
      customAuthURL: config.BPA_URL,
    }
  }
  // ditto = new Ditto({ type: 'onlinePlayground', appID: config.APP_ID, token: config.APP_TOKEN })
  ditto = new Ditto(identity, './ditto')

  //ditto = new Ditto({ type: 'sharedKey', appID: APP_ID, sharedKey: SHARED_KEY})
  if (config.BPA_URL == "NA") {
    ditto.setOfflineOnlyLicenseToken(config.OFFLINE_TOKEN)
  }
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

  rawSub = ditto.store.collection("TAK_Interop").findAll().subscribe()
  rawLiveQuery = ditto.store.collection("TAK_Interop").findAll().observeLocal(async (doc, event) => {
    for (let i = 0; i < 10; i++) {
      sense.setPixel(6, 7, red)
      await sleep(1000)
      sense.setPixel(6, 7, black)
    }
    Logger.info(`raw data received`)
  })

  // wapSub = ditto.store.collection("wap").findByID("wap").subscribe()
  // wapLiveQuery = ditto.store.collection("wap").findByID("wap").observeLocal((doc, event) => {
  //   wap = doc
  //   sense.setPixel(0, 0, blue)
  //   sense.setPixel(0, 0, red)
  //   Logger.info(`wap: ${wap.value}`)
  //   sense.setPixel(0, 0, black)
  // })

  presenceObserver = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length == 0) {
      sense.setPixel(7, 7, black)
    }
    //console.log("local peer key: ", graph.localPeer.peerKey)
    if (graph.remotePeers.length > 0) {
      graph.remotePeers.forEach(peer => {
        Logger.info(`peer: ${peer.deviceName}`);
      })
    }
    sense.setPixel(7, 0, black)
    sense.setPixel(7, 7, black)
    graph.localPeer.connections.forEach((peer) => {
      //console.log("remote peer: ", peer.peer2)
      switch (peer['connectionType']) {
        case "AccessPoint":
          Logger.info(`AP peer: ${peer.id}`);
          sense.setPixel(7, 0, green)
        case "Bluetooth":
          Logger.info(`BLE peer: ${peer.id}`);
          sense.setPixel(7, 7, blue)
      }
    })
  })

}

main()

