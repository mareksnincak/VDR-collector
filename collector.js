'use strict';

const WebSocket = require('ws');
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const urllib = require('urllib');

const ENABLE = 1;
const DISABLE = 0;

if (!args._ || !args.a || !args.p) {
  console.log('Usage: node collector.js ADDRESS -a AUTH -p WS PORT [-o OUTPUT FOLDER] [-r NUMBER OF RETRIES]');
  return;
}

const ADDR = args._[0];
const PORT = args.p;
const AUTH = args.a;
const MAX_RETRIES = Number(args.r) || 3;
const OUTPUT_FOLDER = (args.o && args.o.replace(/(\/|\\)$/, '')) || 'data';

const setDeviceParams = async (params, allowedRetries = MAX_RETRIES) => {
  try {
    const result = await urllib.request(
      `http://${ADDR}/api/param/set`,
      {
        method: 'POST',
        data: {
          "params": [ params ]
        },
        contentType: 'json',
        digestAuth: AUTH,
      }
    );
  
    if (result.status !== 200 || !result.data) throw (result.res && result.res.statusMessage) || result.status;
  
    const data = JSON.parse(result.data);
    if (data.result) throw data;
  } catch (err) {
    if (allowedRetries) {
      console.debug('retrying...');
      await setDeviceParams(params, allowedRetries - 1);
      return;
    }

    throw err;
  }
};

const setDevelopmentRecordStream = async (value = DISABLE) => {
  await setDeviceParams({
    "name": "/deviceSetup/dataOutput/ethernet/pushStream/recordTypeDevelopment",
    "value": String(value)
  });
};

const setStream = async (value = DISABLE) => {
  await setDeviceParams({
    "name": "/deviceSetup/dataOutput/ethernet/pushStream/enable",
    "value": String(value)
  });
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
    console.debug('enabling development record');
    await setDevelopmentRecordStream(ENABLE);
    console.debug('enabling streaming');
    await setStream(ENABLE);
  } catch (err) {
    console.error('error\n', err);
    process.exit();
  }

  if (!fs.existsSync(OUTPUT_FOLDER)){
      fs.mkdirSync(OUTPUT_FOLDER);
  }
  
  collectRecords();
};

process.on('SIGINT', async () => {
  // disable streaming on exit 
  try {
    console.debug('disabling development record and streaming');
    await Promise.all([setDevelopmentRecordStream(DISABLE), setStream(DISABLE)]);
  } catch (err) {
    console.error('error\n', err);
  }

  process.exit();
});

init();
