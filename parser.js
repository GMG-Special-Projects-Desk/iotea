require('dotenv').config({path: `${__dirname}/.env`})
const tlsClientHello = require('is-tls-client-hello')
const sni = require('sni')
const hasRemote = typeof process.env.REMOTE_URL !== 'undefined'

if (hasRemote) {
  console.log(`Ignoring packets to ${process.env.REMOTE_URL}`)
} else {
  console.log(`No REMOTE_URL found`)
}
const parseMac = (e) => {
    const byte = e.toString(16)
    return byte.length === 1 ? `0${byte}` : byte
  }

module.exports = (packet) => {
	const ts = packet.pcap_header.tv_sec
	const eth = packet.payload
	const ip = eth.payload
	if (!ip) {
		return false
	}

	const tcp = ip.payload
	
	if (ip.protocolName === 'Unknown' || typeof ip.payload === 'undefined') {
		return false
	}

	const shost = eth.shost.addr.map(parseMac).join(':').toUpperCase()
	const dhost = eth.dhost.addr.map(parseMac).join(':').toUpperCase()
	
  const src = ip.saddr.addr.join('.')
	const dst = ip.daddr.addr.join('.')

    if (tcp.sport === 8443 ||
        tcp.sport === 443 ||
        tcp.dport === 443 ||
        tcp.dport === 8443) {
      if (tcp.data) {
        if (tlsClientHello(tcp.data)) {
        	const url = sni(tcp.data)
          if (hasRemote) {
            // Don't log the packets being sent to our remote server to prevent recursive hell
            if (url.indexOf(process.env.REMOTE_URL) > -1 ){
              return false
            }
          }
          return {ts: ts, shost: shost , dhost: dhost, saddr: src, daddr: dst, sport: tcp.sport, dport: tcp.dport, type: 'https', payload: url}
        }
      }
      return false
	}

    if (!tcp.data) {
      return false
    }

    const r = tcp.data.toString('utf-8')
    if (r.indexOf('Content-Length') === -1 &&
        r.indexOf('Host') === -1 &&
        r.indexOf('Content-Type') === -1) {
      return false
    }

    try {
      return { ts: ts, shost: shost, dhost: dhost, saddr: src, daddr: dst, sport: tcp.sport, dport: tcp.dport, type: 'http', payload: r }
    } catch (err) {
      console.log(err)
      return false
	}
}