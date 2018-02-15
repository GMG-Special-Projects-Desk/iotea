require('dotenv').config({path: `${__dirname}/.env`})
const hash = require('object-hash')
const pcap = require('pcap')
const session = pcap.createSession(process.env.WLAN_IFACE)
const parse = require('./parser')
const useAws = typeof process.env.AWS_ACCESS_KEY_ID !== 'undefined' && typeof process.env.AWS_SECRET_ACCESS_KEY !== 'undefined' && process.env.AWS_ACCESS_KEY_ID !== '' && process.env.AWS_SECRET_ACCESS_KEY !== ''
const hasRemote = typeof process.env.REMOTE_URL !== 'undefined' &&  process.env.REMOTE_URL !== ''

if (useAws) {
	console.log(`Found AWS Credentials. Posting to stream: ${process.env.FIREHOSE_DELIVERY_STREAM}.`)
	if (!hasRemote){
		console.log(`WARNING: You don't have a REMOTE_URL env variable. This means that you are going to log all the packets going to AWS too.`)
		console.log('Please add the REMOTE_URL env variable to your .env file.')
		console.log('The url normally looks something like this firehose.<YOUR_AWS_REGION>.amazonaws.com')
	}
	const firehoser = require('firehoser');
	const AWS = require('aws-sdk');
	AWS.config.update({
	  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	  region: process.env.AWS_REGION
	});

	let maxDelay = 2000;
	let maxQueued = 100;
	const remote = new firehoser.JSONDeliveryStream(process.env.FIREHOSE_DELIVERY_STREAM,
		maxDelay,
		maxQueued
	);
	session.on('packet', (raw) => {
		const packet = pcap.decode.packet(raw)
		try {
			const parsed = parse(packet, raw)
			if(parsed) {
				const data = {...parsed, id: hash(parsed)}
				remote.putRecord(data)
					.then(() => {
					   console.log('Posted')
					   console.log(data)
					})
					.catch((err) => {
						console.log(err)
					});
			}
		} catch (err) {
			console.log(packet)
			console.log(err)
		}
	})
} else {
	console.log(`Didn't find AWS creds. Running locally`)
	session.on('packet', (raw) => {
		const packet = pcap.decode.packet(raw)
		try {
			const parsed = parse(packet, raw)
			if(parsed) {
				// You can store the data however you want over here
				console.log(parsed)
			}
		} catch (err) {
			console.log(packet)
			console.log(err)
		}
	})
}