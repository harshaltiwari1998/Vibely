package com.vibely.app.data.webrtc

import android.content.Context
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.Camera2Enumerator
import org.webrtc.CameraVideoCapturer
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoSource
import org.webrtc.VideoTrack
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

/**
 * 1-to-1 P2P WebRTC session, kept as close as possible in shape to the web
 * client's `VideoCallService` (services/videoCall.ts): initialize local
 * media, create an offer/answer, feed in the remote description and ICE
 * candidates the signaling server relays, and surface the remote video
 * track and connection state back to the caller.
 */
class PeerConnectionClient(private val context: Context) {

    val eglBase: EglBase = EglBase.create()

    var onIceCandidate: ((IceCandidate) -> Unit)? = null
    var onRemoteVideoTrack: ((VideoTrack) -> Unit)? = null
    var onConnectionStateChange: ((PeerConnection.PeerConnectionState) -> Unit)? = null

    private var factory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var videoCapturer: CameraVideoCapturer? = null
    private var surfaceTextureHelper: SurfaceTextureHelper? = null
    private var localVideoTrack: VideoTrack? = null
    private var localAudioTrack: AudioTrack? = null

    fun initialize(iceServers: List<PeerConnection.IceServer>) {
        val initOptions = PeerConnectionFactory.InitializationOptions
            .builder(context)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initOptions)

        val encoderFactory = DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true)
        val decoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)
        factory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(encoderFactory)
            .setVideoDecoderFactory(decoderFactory)
            .createPeerConnectionFactory()

        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
        }

        peerConnection = factory!!.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onIceCandidate(candidate: IceCandidate) {
                onIceCandidate?.invoke(candidate)
            }

            override fun onTrack(transceiver: org.webrtc.RtpTransceiver) {
                val track = transceiver.receiver.track()
                if (track is VideoTrack) {
                    onRemoteVideoTrack?.invoke(track)
                }
            }

            override fun onConnectionChange(newState: PeerConnection.PeerConnectionState) {
                onConnectionStateChange?.invoke(newState)
            }

            override fun onAddStream(stream: MediaStream) {}
            override fun onRemoveStream(stream: MediaStream) {}
            override fun onDataChannel(channel: org.webrtc.DataChannel) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(receiver: RtpReceiver, streams: Array<out MediaStream>) {}
            override fun onSignalingChange(state: PeerConnection.SignalingState) {}
            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState) {}
            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState) {}
            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>) {}
        })
    }

    /** Starts the front camera + mic and returns the local video track to render. */
    fun startLocalMedia(): VideoTrack {
        val enumerator = Camera2Enumerator(context)
        val frontCamera = enumerator.deviceNames.firstOrNull { enumerator.isFrontFacing(it) }
            ?: enumerator.deviceNames.first()
        videoCapturer = enumerator.createCapturer(frontCamera, null)

        val videoSource: VideoSource = factory!!.createVideoSource(false)
        surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglBase.eglBaseContext)
        videoCapturer!!.initialize(surfaceTextureHelper, context, videoSource.capturerObserver)
        videoCapturer!!.startCapture(1280, 720, 30)

        val videoTrack = factory!!.createVideoTrack("video_${System.currentTimeMillis()}", videoSource)
        localVideoTrack = videoTrack
        peerConnection?.addTrack(videoTrack, listOf("stream"))

        val audioSource = factory!!.createAudioSource(MediaConstraints())
        val audioTrack = factory!!.createAudioTrack("audio_${System.currentTimeMillis()}", audioSource)
        localAudioTrack = audioTrack
        peerConnection?.addTrack(audioTrack, listOf("stream"))

        return videoTrack
    }

    suspend fun createOffer(): SessionDescription = suspendCoroutine { cont ->
        val pc = peerConnection ?: return@suspendCoroutine cont.resumeWithException(IllegalStateException("Not initialized"))
        pc.createOffer(object : SdpObserverAdapter() {
            override fun onCreateSuccess(sdp: SessionDescription) {
                pc.setLocalDescription(SdpObserverAdapter(), sdp)
                cont.resume(sdp)
            }
            override fun onCreateFailure(error: String) {
                cont.resumeWithException(RuntimeException(error))
            }
        }, MediaConstraints())
    }

    suspend fun createAnswer(remoteSdp: SessionDescription): SessionDescription = suspendCoroutine { cont ->
        val pc = peerConnection ?: return@suspendCoroutine cont.resumeWithException(IllegalStateException("Not initialized"))
        pc.setRemoteDescription(object : SdpObserverAdapter() {
            override fun onSetSuccess() {
                pc.createAnswer(object : SdpObserverAdapter() {
                    override fun onCreateSuccess(sdp: SessionDescription) {
                        pc.setLocalDescription(SdpObserverAdapter(), sdp)
                        cont.resume(sdp)
                    }
                    override fun onCreateFailure(error: String) {
                        cont.resumeWithException(RuntimeException(error))
                    }
                }, MediaConstraints())
            }
            override fun onSetFailure(error: String) {
                cont.resumeWithException(RuntimeException(error))
            }
        }, remoteSdp)
    }

    fun setRemoteDescription(remoteSdp: SessionDescription) {
        peerConnection?.setRemoteDescription(SdpObserverAdapter(), remoteSdp)
    }

    fun addIceCandidate(candidate: IceCandidate) {
        peerConnection?.addIceCandidate(candidate)
    }

    fun muteAudio(muted: Boolean) {
        localAudioTrack?.setEnabled(!muted)
    }

    fun muteVideo(muted: Boolean) {
        localVideoTrack?.setEnabled(!muted)
    }

    fun switchCamera() {
        videoCapturer?.switchCamera(null)
    }

    fun dispose() {
        try {
            videoCapturer?.stopCapture()
        } catch (_: Exception) {
        }
        videoCapturer?.dispose()
        surfaceTextureHelper?.dispose()
        localVideoTrack?.dispose()
        localAudioTrack?.dispose()
        peerConnection?.close()
        peerConnection?.dispose()
        factory?.dispose()
        eglBase.release()
    }

    private open class SdpObserverAdapter : SdpObserver {
        override fun onCreateSuccess(sdp: SessionDescription) {}
        override fun onSetSuccess() {}
        override fun onCreateFailure(error: String) {}
        override fun onSetFailure(error: String) {}
    }
}
