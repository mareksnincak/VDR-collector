'use strict';

const WebSocket = require('ws');
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const urllib = require('urllib');

if (!args._ || !args.a || !args.p) {
  console.log('Usage: node collector.js ADDRESS -a AUTH -p WS PORT [-o OUTPUT FOLDER] [-r NUMBER OF RETRIES]');
  return;
}

const ADDR = args._[0];
const PORT = args.p;
const AUTH = args.a;
const MAX_RETRIES = Number(args.r) || 3;
const OUTPUT_FOLDER = (args.o && args.o.replace(/(\/|\\)$/, '')) || 'data';


const setDevelopmentRecordStream = async (value = 0, allowedRetries = MAX_RETRIES) => {
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
    
    console.debug('done');
  } catch (err) {
    if (allowedRetries) {
      console.debug('retrying...');
      await setDevelopmentRecordStream(value, allowedRetries - 1);
      return;
    }

    throw err;
  }
};

const collectRecords = (allowedRetries = MAX_RETRIES) => {
  const ws = new WebSocket(`ws://${ADDR}:${PORT}`);
    
  console.log('waiting for device');

  ws.on('open', () => {
    console.log('connected');
  });

  ws.on('message', data => {
    fs.writeFile(`${OUTPUT_FOLDER}/vdr-${Date.now()}.json`, data, err => {
      if (err) throw err;
      console.log('record saved');
    });
  });

  ws.on('error', err => {
    if (allowedRetries) {
      console.debug('retrying...');
      collectRecords(allowedRetries - 1);
      return;
    }

    console.error(err);
    return;
  });
};

const init = async () => {
  try {
    console.debug('enabling development record streaming');
    await setDevelopmentRecordStream(1);
  } catch (err) {
    console.error('unable to set development record streaming\n', err);
    process.exit();
  }

  if (!fs.existsSync(OUTPUT_FOLDER)){
      fs.mkdirSync(OUTPUT_FOLDER);
  }
  
  collectRecords();
};

init();

process.on('SIGINT', async () => {
  // disable development record on exit
  try {
    console.debug('disabling development record streaming');
    await setDevelopmentRecordStream(0);
  } catch (err) {
    console.error('unable to set development record streaming\n', err);
  }

  process.exit();
});
