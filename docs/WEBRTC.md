# Vibely WebRTC Documentation

## Architecture

Vibely uses WebRTC for peer-to-peer video and audio calling. Media flows directly between users without passing through backend servers.

```
User A ←——WebRTC Media——→ User B
    ↕                          ↕
Signaling Server (Backend)
```

## Signaling Flow

1. **Call Initiation**: User A calls User B via backend API
2. **Match Found**: Backend creates match and notifies both users
3. **WebSocket Connection**: Both users connect to WebSocket server
4. **Offer/Answer**: SDP offer/answer exchanged via WebSocket
5. **ICE Candidates**: ICE candidates exchanged via WebSocket
6. **Direct Connection**: P2P connection established
7. **Call Active**: Media flows directly between peers

## STUN/TURN Configuration

### STUN Servers
- Google STUN: `stun:stun.l.google.com:19302`
- Custom STUN: Configure via `TURN_SERVER_URL`

### TURN Servers
Required for users behind symmetric NAT or firewalls.

#### Environment Variables
```
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=your-username
TURN_PASSWORD=your-password
```

#### Recommended TURN Providers
- Twilio Network Traversal
- Xirsys
- self-hosted coturn

## Connection States

### States
- `new`: Initial state
- `checking`: ICE candidates being gathered
- `connected`: Connection established
- `completed`: All ICE candidates gathered
- `failed`: Connection failed
- `disconnected`: Connection lost
- `closed`: Connection closed

### Reconnection
- Automatic reconnection on network interruption
- ICE restart initiated after 5 seconds of disconnection
- Call marked as failed after 30 seconds of failed reconnection

## Media Constraints

### Video
- Preferred resolution: 720p (1280x720)
- Max resolution: 1080p (1920x1080)
- Frame rate: 30fps
- Codec: VP8/VP9/H.264

### Audio
- Codec: Opus
- Sample rate: 48kHz
- Channels: 2 (stereo)
- Bitrate: 64kbps

## Platform-Specific Notes

### Web (React)
- Uses native RTCPeerConnection API
- MediaDevices API for camera/mic access
- getUserMedia constraints configurable

### Android
- Uses Google WebRTC library (`org.webrtc:google-webrtc`)
- Camera2 API for camera access
- AudioManager for audio routing (Bluetooth, speaker, earpiece)

## Troubleshooting

### Call Won't Connect
1. Check STUN/TURN server reachability
2. Verify firewall allows UDP traffic
3. Check WebSocket connection (signaling)
4. Review ICE candidate gathering

### Poor Video Quality
1. Check network bandwidth
2. Reduce video resolution/bitrate
3. Verify TURN server not overloaded
4. Check for packet loss

### Audio Issues
1. Check microphone permissions
2. Verify audio codec support
3. Check Bluetooth audio routing (Android)
4. Review echo cancellation settings
