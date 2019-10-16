const WebSocket = require('ws');
const fs = require('fs');

const ADDR = 'ws://192.168.192.207:33333';

const dir = 'data';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const ws = new WebSocket(ADDR);

console.log('waiting for device');

ws.on('open', () => {
  console.log('connected');
});

ws.on('message', data => {
  fs.writeFile(`${dir}/vdr-${Date.now()}.json`, data, err => {
    if (err) throw err;
    console.log('record saved');
  });
});
