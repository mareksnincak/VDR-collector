'use strict';

const WebSocket = require('ws');
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const urllib = require('urllib');

if (!args._ || !args.a || !args.p) {
  console.log('Usage: node collector.js ADDRESS -a AUTH -p WS PORT');
  return;
}

const ADDR = args._[0];
const PORT = args.p;
const AUTH = args.a;

const setRecordTypeDevelopment = async (value = 0, retry = 3) => {
  try {
    const result = await urllib.request(
      `http://${ADDR}/api/param/set`,
      {
        method: 'POST',
        data: {
          "params": [
              {
                  "name": "/deviceSetup/dataOutput/ethernet/pushStream/recordTypeDevelopment",
                  "value": String(value)
              }
          ]
        },
        contentType: 'json',
        digestAuth: AUTH,
      }
    );
  
    if (result.status !== 200 || !result.data) throw (result.res && result.res.statusMessage) || result.status;
  
    const data = JSON.parse(result.data);
    if (data.result) throw data;
    
    console.debug('development record streaming set');
  } catch (err) {
    if (retry) {
      console.debug('retrying...');
      await setRecordTypeDevelopment(value, retry - 1);
      return;
    }

    throw err;
  }
};

const init = async () => {
  try {
    console.debug('enabling development record streaming');
    await setRecordTypeDevelopment(1);
  } catch (err) {
    console.error('unable to set development record streaming\n', err);
    process.exit();
  }

  const dir = 'data';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  
  // connect to device
  
  const ws = new WebSocket(`ws://${ADDR}:${PORT}`);
  
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
  
  ws.on('error', err => {
    console.log(err);
  });
};

init();

process.on('SIGINT', async () => {
  // disable development record
  try {
    console.debug('disabling development record streaming');
    await setRecordTypeDevelopment(0);
  } catch (err) {
    console.error('unable to set development record streaming\n', err);
  }
  console.debug('disabled dev record saving');
  process.exit();
});
