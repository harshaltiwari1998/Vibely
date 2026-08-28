package com.vibely.app.data.remote

import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject
import java.net.URISyntaxException

class CallSocketManager(private val baseUrl: String) {
    private var socket: Socket? = null

    fun connect(token: String, listener: CallSocketListener) {
        try {
            val opts = IO.Options()
            opts.forceNew = true
            opts.reconnection = true
            opts.query = "token=$token"
            val url = baseUrl.removeSuffix("/")
            socket = IO.socket("$url/signal", opts)

            socket?.on(Socket.EVENT_CONNECT) { listener.onConnected() }
            socket?.on(Socket.EVENT_DISCONNECT) { listener.onDisconnected() }
            socket?.on(Socket.EVENT_CONNECT_ERROR) { listener.onError(it.firstOrNull()?.toString() ?: "connect error") }
            socket?.on("call_started") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onCallStarted(
                    data?.optString("callId") ?: "",
                    data?.optString("initiatorId") ?: "",
                    data?.optString("receiverId") ?: "",
                )
            }
            socket?.on("call_offer") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onCallOffer(
                    data?.optString("callId") ?: "",
                    data?.optString("fromUserId") ?: "",
                    data?.optJSONObject("sdp"),
                )
            }
            socket?.on("call_answer") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onCallAnswer(
                    data?.optString("callId") ?: "",
                    data?.optString("fromUserId") ?: "",
                    data?.optJSONObject("sdp"),
                )
            }
            socket?.on("ice_candidate") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onIceCandidate(
                    data?.optString("callId") ?: "",
                    data?.optString("fromUserId") ?: "",
                    data?.optJSONObject("candidate"),
                )
            }
            socket?.on("call_ready") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onCallReady(data?.optString("callId") ?: "")
            }
            socket?.on("call_ended") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onCallEnded(
                    data?.optString("callId") ?: "",
                    data?.optInt("durationSeconds") ?: 0,
                    data?.optString("reason"),
                )
            }
            socket?.on("call_failed") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onCallFailed(
                    data?.optString("callId") ?: "",
                    data?.optString("reason"),
                )
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            listener.onError(e.message ?: "invalid url")
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.close()
        socket = null
    }

    fun send(event: String, data: JSONObject) {
        socket?.emit(event, data)
    }

    interface CallSocketListener {
        fun onConnected()
        fun onDisconnected()
        fun onError(message: String)
        fun onCallStarted(callId: String, initiatorId: String, receiverId: String)
        fun onCallOffer(callId: String, fromUserId: String, sdp: JSONObject?)
        fun onCallAnswer(callId: String, fromUserId: String, sdp: JSONObject?)
        fun onIceCandidate(callId: String, fromUserId: String, candidate: JSONObject?)
        fun onCallReady(callId: String)
        fun onCallEnded(callId: String, durationSeconds: Int, reason: String?)
        fun onCallFailed(callId: String, reason: String?)
    }
}
