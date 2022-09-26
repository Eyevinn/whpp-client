# WHPP Client Library

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

A Node / JS library for [WebRTC HTTP Playback Protocol](https://github.com/Eyevinn/webrtc-http-playback-protocol/blob/master/webrtc-http-playback-protocol.md)

For more information about WHIP and WHPP read [this blog post](https://medium.com/@eyevinntechnology/whip-whpp-for-webrtc-based-broadcast-streaming-2cf469e95299).

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

## Options

```
{
  debug?: boolean; // Use debug logging
  noIceTrickle?: boolean; // Wait for all ICE candidates to be gathered
  timeout?: number; // Timeout for gathering ICE candidates
  useLegacyContentType?: boolean; // WHPP endpoints that does not support the `whpp+json` content type
}
```

## Examples

| Example | Description | Source |
| ------- | ----------- | ------ |
| `npm run example:web` | WHPP implementation in browser | `examples/web.html` |

## Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
