const DEFAULT_CONNECT_TIMEOUT = 2000;

export interface WHPPCandidateRequest {
  candidate: string;
}

export interface WHPPAnswerRequest {
  answer: string;
}

export interface WHPPMediaStream {
  streamId: string;
}

export interface WHPPOfferResponse {
  offer: string;
  mediaStreams: WHPPMediaStream[];
}

interface WHPPClientOpts {
  debug?: boolean;
  noIceTrickle?: boolean;
  timeout?: number;
  useLegacyContentType?: boolean;
}

export class WHPPClient {
  private localPeer: RTCPeerConnection;
  private whppUrl: URL;
  private iceGatheringTimeout: any;
  private waitingForCandidates: boolean = false;
  private resourceUrl: URL | undefined = undefined;
  private opts?: WHPPClientOpts;
  
  constructor(peer: RTCPeerConnection, whppUrl: URL, opts?: WHPPClientOpts) {
    this.localPeer = peer;
    this.whppUrl = whppUrl;

    this.opts = opts;

    this.localPeer.onicegatheringstatechange = this.onIceGatheringStateChange.bind(this);
    this.localPeer.oniceconnectionstatechange =
      this.onIceConnectionStateChange.bind(this);
    this.localPeer.onicecandidateerror = this.onIceCandidateError.bind(this);
    this.localPeer.onicecandidate = this.onIceCandidate.bind(this);
  }

  getPeer(): RTCPeerConnection {
    return this.localPeer;
  }

  async connect() {
    let response = await fetch(this.whppUrl.href, {
      method: "POST",
      headers: {
        "Content-Type": "application/whpp+json"
      },
      body: '{}'
    });

    if (!response.ok) {
      if (response.status === 415) {
        this.opts.useLegacyContentType = true;
        response = await fetch(this.whppUrl.href, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: '{}'
        });    
      } else {
        return;
      }
    }

    const offerResponse = <WHPPOfferResponse>await response.json();
    const locationHeader = response.headers.get('location');
    this.resourceUrl = new URL(locationHeader);

    if (!this.supportsTrickleIce()) {
      this.waitingForCandidates = true;
    }

    await this.localPeer.setRemoteDescription({type: 'offer', sdp: offerResponse.offer});

    const answer = await this.localPeer.createAnswer();
    await this.localPeer.setLocalDescription(answer);

    if (this.supportsTrickleIce()) {
      await this.sendAnswer();
    } else {
      this.iceGatheringTimeout = setTimeout(this.onIceGatheringTimeout.bind(this), this.opts?.timeout || DEFAULT_CONNECT_TIMEOUT);
    }
  }

  private log(...args: any[]) {
    if (this.opts?.debug) {
      console.log("whpp-client", ...args);
    }
  }

  private error(...args: any[]) {
    console.error("whpp-client", ...args);
  }

  private onIceGatheringStateChange(event: Event) {
    this.log("IceGatheringState", this.localPeer.iceGatheringState);

    if (this.localPeer.iceGatheringState !== 'complete' || this.supportsTrickleIce() || !this.waitingForCandidates) {
      return;
    }

    this.onDoneWaitingForCandidates();
  }

  private onIceConnectionStateChange(e) {
    this.log("IceConnectionState", this.localPeer.iceConnectionState);

    if (this.localPeer.iceConnectionState === 'failed') {
      this.localPeer.close();
    }
  }

  private async onIceCandidate(event: Event) {
    if (event.type !== 'icecandidate') {
      return;
    }
    const candidateEvent = <RTCPeerConnectionIceEvent>(event);
    const candidate: RTCIceCandidate | null = candidateEvent.candidate;
    if (!candidate) {
      return;
    }

    this.log("IceCandidate", candidate.candidate);

    if (!this.supportsTrickleIce()) {
      return;
    }

    this.sendCandidate(candidate);
  }

  private onIceCandidateError(e) {
    this.log("IceCandidateError", e);
  }

  private onIceGatheringTimeout() {
    this.log("IceGatheringTimeout");

    if (this.supportsTrickleIce() || !this.waitingForCandidates) {
      return;
    }

    this.onDoneWaitingForCandidates();
  }

  private supportsTrickleIce(): boolean {
    return this.opts && !this.opts.noIceTrickle;
  }

  private async onDoneWaitingForCandidates() {
    this.waitingForCandidates = false;
    clearTimeout(this.iceGatheringTimeout);

    await this.sendAnswer();
  }

  private async sendCandidate(rtcIceCandidate: RTCIceCandidate) {
    const candidateRequest: WHPPCandidateRequest = {
      candidate: rtcIceCandidate.candidate
    };

    const response = await fetch(this.resourceUrl.href, {
      method: "PATCH",
      headers: {
        "Content-Type": !this.opts?.useLegacyContentType ? "application/whpp+json" : "application/json"
      },
      body: JSON.stringify(candidateRequest)
    });

    if (!response.ok) {
      this.error(`sendCandidate response: ${response.status}`);
    }
  }

  private async sendAnswer() {
    const answer = this.localPeer.localDescription;

    const answerRequest:WHPPAnswerRequest = {
      answer: answer.sdp
    }

    const response = await fetch(this.resourceUrl.href, {
      method: "PUT",
      headers: {
        "Content-Type": !this.opts?.useLegacyContentType ? "application/whpp+json" : "application/json"
      },
      body: JSON.stringify(answerRequest)
    });

    if (!response.ok) {
      this.error(`sendAnswer response: ${response.status}`);
    }
  }
}