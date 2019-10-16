# VDR-collector

Used to collect VDR from device

 #### dependencies

  [NodeJS 12](https://nodejs.org/en/)

#### usage

 1. Enable ethernet stream from device [http://192.168.192.207/ui/device/data-output](http://192.168.192.207/ui/device/data-output) 
 2. Run app:
	```bash
    cd VDR-collector
    npm install
    npm run serve
    ```

#### output
Check */data* folder. One file corresponds to one VDR record.

Filename convention: *vdr-%timestamp in ms%.json* .
