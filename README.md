# BLE and WiFi Demo
Use Ditto's database as a control plane for establishing a
WiFi connection via BLE.

Uses a Raspberry Pi with a SenseHat as the sensor node, and
another Linux-based device to configure as the Access Point.

## Configuration

Need a `config.json` in the root directory:

```
{
  "ditto": {
    "APP_ID": "",
    "APP_TOKEN": ""
  }
}
```


