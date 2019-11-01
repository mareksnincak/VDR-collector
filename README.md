# VDR-collector

Used to collect VDR from device

### dependencies

[NodeJS 12](https://nodejs.org/en/)

### usage

```bash
cd VDR-collector
npm install
node collector.js ADDRESS -a AUTH -p WS PORT [-o OUTPUT FOLDER] [-r NUMBER OF RETRIES]
```

##### parameters
* `ADDRESS` device IP address
* `-a AUTH` authentication string in format `USERNAME:PASSWORD`
* `-p WS PORT` VDR stream port
* `-o OUTPUT FOLDER` (optional) folder to store output files
* `-r NUMBER OF RETRIES` (optional) number of retries in case of failed network operations

##### examples

```bash
node collector.js 182.108.142.232 -a user123:mypassword -p 12345
node collector.js 182.108.142.232 -a user123:mypassword -p 12345 -o C:\Users\user123\Desktop\out
node collector.js 182.108.142.232 -a user123:mypassword -p 12345 -o C:\Users\user123\Desktop\out -r 5
```

### output
Data output is saved to */data* folder by default. One file corresponds to one VDR record.

Filename convention: *vdr-%timestamp in ms%.json* .
