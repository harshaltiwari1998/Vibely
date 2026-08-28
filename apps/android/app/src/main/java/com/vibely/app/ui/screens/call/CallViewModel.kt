package com.vibely.app.ui.screens.call

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibely.app.data.local.SessionPreferences
import com.vibely.app.data.remote.CallSocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONObject
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.AudioTrack
import org.webrtc.Camera1Enumerator
import org.webrtc.CameraEnumerator
import org.webrtc.CameraVideoCapturer
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoCapturer
import org.webrtc.VideoSource
import org.webrtc.VideoTrack

enum class CallState { IDLE, CONNECTING, CONNECTED, RECONNECTING, FAILED, ENDED }

data class CallUiState(
    val callState: CallState = CallState.IDLE,
    val callId: String? = null,
    val peerId: String? = null,
    val elapsedSeconds: Int = 0,
    val audioMuted: Boolean = false,
    val videoMuted: Boolean = false,
    val isFrontCamera: Boolean = true,
    val error: String? = null,
)

class CallViewModel(
    private val context: Context,
    private val session: SessionPreferences,
    private val socketManager: CallSocketManager,
) : ViewModel() {
    private val _state = MutableStateFlow(CallUiState())
    val state: StateFlow<CallUiState> = _state.asStateFlow()

    private var peerConnection: PeerConnection? = null
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var eglBase: EglBase? = null
    private var videoCapturer: VideoCapturer? = null
    private var localVideoTrack: VideoTrack? = null
    private var localAudioTrack: AudioTrack? = null
    private var localMediaStream: MediaStream? = null
    private var remoteVideoTrack: VideoTrack? = null
    private var timerJob: kotlinx.coroutines.Job? = null
    private var socketListener: CallSocketManager.SocketListener? = null

    init {
        viewModelScope.launch {
            val token = session.accessToken.first()
            if (!token.isNullOrBlank()) {
                connectSocket(token)
            }
        }
    }

    private fun connectSocket(token: String) {
        socketListener = object : CallSocketManager.SocketListener {
            override fun onConnected() {}
            override fun onDisconnected() {}
            override fun onError(message: String) {
                _state.update { copy(error = message) }
            }

            override fun onCallStarted(callId: String, initiatorId: String, receiverId: String) {
                viewModelScope.launch {
                    val myId = session.userId.first() ?: return@launch
                    val isInitiator = myId == initiatorId
                    _state.update { copy(callId = callId, peerId = if (isInitiator) receiverId else initiatorId) }
                    startCall(callId, isInitiator)
                }
            }

            override fun onCallOffer(callId: String, fromUserId: String, sdp: JSONObject?) {
                if (_state.value.callId != callId) return
                val type = sdp?.optString("type") ?: "offer"
                val desc = sdp?.optString("sdp") ?: return
                handleRemoteDescription(SessionDescription(SessionDescription.Type.fromCanonicalForm(type), desc))
            }

            override fun onCallAnswer(callId: String, fromUserId: String, sdp: JSONObject?) {
                if (_state.value.callId != callId) return
                val type = sdp?.optString("type") ?: "answer"
                val desc = sdp?.optString("sdp") ?: return
                handleRemoteDescription(SessionDescription(SessionDescription.Type.fromCanonicalForm(type), desc))
            }

            override fun onIceCandidate(callId: String, fromUserId: String, candidate: JSONObject?) {
                if (_state.value.callId != callId) return
                val sdpMid = candidate?.optString("sdpMid") ?: return
                val sdpMLineIndex = candidate?.optInt("sdpMLineIndex") ?: 0
                val sdp = candidate?.optString("candidate") ?: return
                peerConnection?.addIceCandidate(IceCandidate(sdpMid, sdpMLineIndex, sdp))
            }

            override fun onCallReady(callId: String) {
                if (_state.value.callId != callId) return
                _state.update { copy(callState = CallState.CONNECTING) }
            }

            override fun onCallEnded(callId: String, durationSeconds: Int, reason: String?) {
                if (_state.value.callId != callId) return
                endCall()
                _state.update { copy(callState = CallState.ENDED, elapsedSeconds = durationSeconds) }
            }

            override fun onCallFailed(callId: String, reason: String?) {
                if (_state.value.callId != callId) return
                _state.update { copy(callState = CallState.FAILED, error = reason) }
                endCall()
            }
        }
        socketManager.connect("Bearer $token", socketListener!!)
    }

    fun startCall(callId: String, isInitiator: Boolean) {
        viewModelScope.launch {
            _state.update { copy(callState = CallState.CONNECTING, error = null) }
            initWebRTC()
            if (isInitiator) {
                createOffer()
            }
            startTimer()
        }
    }

    private suspend fun initWebRTC() {
        val permissions = arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            _state.update { copy(callState = CallState.FAILED, error = "Missing permissions: ${missing.joinToString()}") }
            return
        }

        eglBase = EglBase.create()
        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(context)
                .setEnableInternalTracer(true)
                .setFieldTrials("")
                .createInitializationOptions()
        )

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(DefaultVideoEncoderFactory(eglBase?.eglBaseContext, true, true))
            .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase?.eglBaseContext))
            .createPeerConnectionFactory()

        val videoSource = peerConnectionFactory?.createVideoSource(false)
        val audioSource = peerConnectionFactory?.createAudioSource(MediaConstraints())

        val surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglBase?.eglBaseContext)
        videoCapturer = createCameraCapturer(Camera1Enumerator(true))
        videoCapturer?.initialize(surfaceTextureHelper, context, videoSource?.capturerObserver)
        videoCapturer?.startCapture(1280, 720, 30)

        localVideoTrack = peerConnectionFactory?.createVideoTrack("local_video", videoSource)
        localAudioTrack = peerConnectionFactory?.createAudioTrack("local_audio", audioSource)

        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
        audioManager.isSpeakerphoneOn = true

        localMediaStream = peerConnectionFactory?.createLocalMediaStream("local_stream").also {
            it?.addTrack(localVideoTrack)
            it?.addTrack(localAudioTrack)
        }

        val iceServers = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
            PeerConnection.IceServer.builder("turn:turn.vibely.app:3478").setUsername("vibely").setPassword("vibely").createIceServer(),
        )

        peerConnection = peerConnectionFactory?.createPeerConnection(
            PeerConnection.RTCConfiguration(iceServers).apply {
                tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ALL
            },
            object : PeerConnection.Observer {
                override fun onIceCandidate(p0: IceCandidate?) {
                    p0 ?: return
                    val callId = _state.value.callId ?: return
                    val payload = JSONObject()
                    payload.put("callId", callId)
                    payload.put("toUserId", _state.value.peerId ?: return)
                    val candidate = JSONObject()
                    candidate.put("sdpMid", p0.sdpMid)
                    candidate.put("sdpMLineIndex", p0.sdpMLineIndex)
                    candidate.put("candidate", p0.sdp)
                    payload.put("candidate", candidate)
                    socketManager.send("ice_candidate", payload)
                }

                override fun onAddStream(p0: MediaStream?) {
                    p0 ?: return
                    remoteVideoTrack = p0.videoTracks.firstOrNull()
                }

                override fun onIceConnectionChange(p0: PeerConnection.IceConnectionState?) {
                    when (p0) {
                        PeerConnection.IceConnectionState.CONNECTED -> _state.update { copy(callState = CallState.CONNECTED) }
                        PeerConnection.IceConnectionState.DISCONNECTED -> _state.update { copy(callState = CallState.RECONNECTING) }
                        PeerConnection.IceConnectionState.FAILED -> _state.update { copy(callState = CallState.FAILED) }
                        else -> {}
                    }
                }

                override fun onConnectionChange(p0: PeerConnection.PeerConnectionState?) {
                    when (p0) {
                        PeerConnection.PeerConnectionState.CONNECTED -> _state.update { copy(callState = CallState.CONNECTED) }
                        PeerConnection.PeerConnectionState.DISCONNECTED -> _state.update { copy(callState = CallState.RECONNECTING) }
                        PeerConnection.PeerConnectionState.FAILED -> _state.update { copy(callState = CallState.FAILED) }
                        else -> {}
                    }
                }

                override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
                override fun onIceConnectionReceivingChange(p0: Boolean) {}
                override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
                override fun onIceCandidate(p0: java.util.ArrayList<IceCandidate>?) {}
                override fun onRemoveStream(p0: MediaStream?) {}
                override fun onDataChannel(p0: org.webrtc.DataChannel?) {}
                override fun onRenegotiationNeeded() {}
                override fun onTrack(p0: org.webrtc.RtpTransceiver?) {}
            }
        )

        localMediaStream?.let { peerConnection?.addStream(it) }
    }

    private suspend fun createOffer() {
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
        }
        val callId = _state.value.callId ?: return
        peerConnection?.createOffer(object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription?) {
                desc ?: return
                peerConnection?.setLocalDescription(object : SdpObserver {
                    override fun onSetSuccess() {
                        val payload = JSONObject()
                        payload.put("callId", callId)
                        payload.put("toUserId", _state.value.peerId ?: return@onSetSuccess)
                        val sdp = JSONObject()
                        sdp.put("type", desc.type.canonicalForm())
                        sdp.put("sdp", desc.description)
                        payload.put("sdp", sdp)
                        socketManager.send("call_offer", payload)
                    }

                    override fun onSetFailure(p0: String?) {}
                    override fun onCreateSuccess(p0: SessionDescription?) {}
                    override fun onCreateFailure(p0: String?) {}
                }, desc)
            }

            override fun onCreateFailure(p0: String?) {}
            override fun onSetSuccess() {}
            override fun onSetFailure(p0: String?) {}
        }, constraints)
    }

    private fun handleRemoteDescription(desc: SessionDescription) {
        peerConnection?.setRemoteDescription(object : SdpObserver {
            override fun onSetSuccess() {
                if (desc.type == SessionDescription.Type.OFFER) {
                    val constraints = MediaConstraints().apply {
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                        mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
                    }
                    peerConnection?.createAnswer(object : SdpObserver {
                        override fun onCreateSuccess(answer: SessionDescription?) {
                            answer ?: return
                            peerConnection?.setLocalDescription(object : SdpObserver {
                                override fun onSetSuccess() {
                                    val callId = _state.value.callId ?: return@onSetSuccess
                                    val payload = JSONObject()
                                    payload.put("callId", callId)
                                    payload.put("toUserId", _state.value.peerId ?: return@onSetSuccess)
                                    val sdp = JSONObject()
                                    sdp.put("type", answer.type.canonicalForm())
                                    sdp.put("sdp", answer.description)
                                    payload.put("sdp", sdp)
                                    socketManager.send("call_answer", payload)
                                }

                                override fun onSetFailure(p0: String?) {}
                                override fun onCreateSuccess(p0: SessionDescription?) {}
                                override fun onCreateFailure(p0: String?) {}
                            }, answer)
                        }

                        override fun onCreateFailure(p0: String?) {}
                        override fun onSetSuccess() {}
                        override fun onSetFailure(p0: String?) {}
                    }, constraints)
                }
            }

            override fun onSetFailure(p0: String?) {}
            override fun onCreateSuccess(p0: SessionDescription?) {}
            override fun onCreateFailure(p0: String?) {}
        }, desc)
    }

    fun toggleAudio() {
        val next = !_state.value.audioMuted
        localAudioTrack?.setEnabled(!next)
        _state.update { copy(audioMuted = next) }
    }

    fun toggleVideo() {
        val next = !_state.value.videoMuted
        localVideoTrack?.setEnabled(!next)
        _state.update { copy(videoMuted = next) }
    }

    fun switchCamera() {
        val cameraEnumerator = Camera1Enumerator(true)
        val deviceName = if (_state.value.isFrontCamera) {
            cameraEnumerator.deviceNames.find { it.contains("front", ignoreCase = true) || it.contains("front", ignoreCase = true) }
                ?: cameraEnumerator.deviceNames.firstOrNull()
        } else {
            cameraEnumerator.deviceNames.find { it.contains("back", ignoreCase = true) || it.contains("back", ignoreCase = true) }
                ?: cameraEnumerator.deviceNames.firstOrNull()
        } ?: return

        viewModelScope.launch {
            try {
                videoCapturer?.stopCapture()
                videoCapturer?.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
                    override fun onCameraSwitchDone(p0: Boolean) {
                        _state.update { copy(isFrontCamera = !_state.value.isFrontCamera) }
                    }

                    override fun onCameraSwitchError(p0: String?) {
                        _state.update { copy(error = p0) }
                    }
                }, deviceName)
            } catch (e: Exception) {
                _state.update { copy(error = e.message) }
            }
        }
    }

    fun endCall() {
        viewModelScope.launch {
            val callId = _state.value.callId ?: return@launch
            try {
                val payload = JSONObject()
                payload.put("callId", callId)
                socketManager.send("call_end", payload)
            } catch (e: Exception) {
                // ignore
            }
            cleanup()
            _state.update { copy(callState = CallState.ENDED, elapsedSeconds = 0) }
            timerJob?.cancel()
        }
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (true) {
                kotlinx.coroutines.delay(1000)
                _state.update { copy(elapsedSeconds = elapsedSeconds + 1) }
            }
        }
    }

    private fun cleanup() {
        try {
            videoCapturer?.stopCapture()
        } catch (e: Exception) {
            // ignore
        }
        videoCapturer?.dispose()
        videoCapturer = null
        localVideoTrack?.dispose()
        localAudioTrack?.dispose()
        localMediaStream?.dispose()
        peerConnection?.close()
        peerConnection = null
        peerConnectionFactory?.dispose()
        peerConnectionFactory = null
        eglBase?.release()
        eglBase = null
        remoteVideoTrack = null
    }

    override fun onCleared() {
        super.onCleared()
        cleanup()
        timerJob?.cancel()
        socketListener?.let { socketManager.disconnect() }
    }

    private fun MutableStateFlow<CallUiState>.update(block: CallUiState.() -> CallUiState) {
        value = value.block()
    }
}
