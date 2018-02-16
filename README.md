
## 🔎🏡  [How To Surveil Your Smart Home](https://gizmodo.com/how-to-surveil-your-smart-home-1822939698)



By default this script just outputs what it sees in the console. It is also set up to send data to an S3 bucket through AWS Kinesis if you want to use that. We used Kinesis for convenience but it is by no means necessary; you can store the parsed data wherever you want.

This script only parses HTTP and HTTPS packets. It is not meant to be a comprehensive look at all the traffic going over the network. It's just enough so that you can get a sense of what the devices you own are saying to their servers.



### Things you will need

- A Raspberry Pi 3 with Node.js v8.9.1 or above installed.
  - You could use a Pi 2 with an external Wi-Fi dongle

- Ethernet connection to the internet from the Pi

  ​

## Installation

- Clone this repo

- `cd iotea `

- `npm install`

- Add a `.env` file with your config

- `npm run dev`

- You should see a stream of packets like this in the console

- ```{ ts: 1518727194,
  { ts: 1518727194,
    shost: '8C:85:90:50:66:05',
    dhost: '8C:09:F4:0E:65:67',
    saddr: '192.168.0.42',
    daddr: '216.10.119.205',
    sport: 59024,
    dport: 443,
    type: 'https',
    payload: 'someurl.com',
    id: '10f43a3c9ecb22affd1afdafaa4643e9a578ac37' }
  ```

- Object keys:

  - `ts` timestamp
  - `shost` Packet source MAC address
  - `dhost` Packet destination MAC address
  - `saddr` Packet source IP address
  - `daddr` Packet destination IP address
  - `sport` Packet source port
  - `dport` Packet destination port
  - `type`  HTTP or HTTPS. If HTTPS it will have the url the packet is trying to reach. If HTTP it will have the entire payload
  - `id` Hash from the Object

- If you want to run on boot add `/usr/bin/nodejs /path/to/iotea/index.js 2>&1 &` to your [/etc/rc.local](https://www.raspberrypi.org/documentation/linux/usage/rc-local.md)



### Configuration

Add a `.env` file to this folder with the following variables:

Essential:

`WLAN_IFACE`:  What interface are you listening on? By default its `wlan0`

If you are using AWS Kineses:

`FIREHOSE_DELIVERY_STREAM`
`AWS_ACCESS_KEY_ID`
`AWS_SECRET_ACCESS_KEY`
`AWS_REGION`



If you are using any remote server to store data

`REMOTE_URL`: The URL for your remote. Need to add this in here so that the packet sniffer ignores packets going to that URL. 






### Additional things

Since Kashmir lives in San Francisco and I live in New York, I had to set up a reverse ssh-tunnel to be able to debug the Pi remotely. I'm not going to go into the details of that set-up for the sake of simplicity but in case you have a similar requirement I followed the steps in [this tutorial](https://jerrygamblin.com/2016/04/23/persistent-reverse-ssh-tunnels-on-a-raspberrypi/) which worked for me. You will need to know the basics of how ssh works and will probably also want to know how to set up a VPS like an AWS EC2 instance or a Digital Ocean droplet for example.

