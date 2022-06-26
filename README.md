# WHPP Client Library

A node / JS library for WebRTC HTTP Playback Protocol

## Usage

```
npm install --save @eyevinn/whpp-client
```

Example on how to implement the WHPP library in browser.

```javascript
import { WHPPClient } from "@eyevinn/whpp-client";

const video = document.querySelector("video");
const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
peer.ontrack = (ev) => {
  if (ev.streams && ev.streams[0]) {
    video.srcObject = ev.streams[0];
  }
};
const client = new WHPPClient(peer, "http://localhost:8001/broadcaster/channel/test");
await client.connect();

```

### Examples

| Example | Description | Source |
| ------- | ----------- | ------ |
| `npm run example:web` | WHPP implementation in browser | `examples/web.html` |

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
