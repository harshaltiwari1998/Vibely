package com.vibely.app.data.remote

import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager(private val baseUrl: String) {
    private var socket: Socket? = null

    fun connect(token: String, listener: SocketListener) {
        try {
            val opts = IO.Options()
            opts.forceNew = true
            opts.reconnection = true
            opts.query = "token=$token"
            val url = baseUrl.removeSuffix("/")
            socket = IO.socket("$url", opts)

            socket?.on(Socket.EVENT_CONNECT) { listener.onConnected() }
            socket?.on(Socket.EVENT_DISCONNECT) { listener.onDisconnected() }
            socket?.on(Socket.EVENT_CONNECT_ERROR) { listener.onError(it.firstOrNull()?.toString() ?: "connect error") }
            socket?.on("match_searching") { listener.onMatchSearching() }
            socket?.on("match_found") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onMatchFound(
                    data?.optString("matchId") ?: "",
                    data?.optString("peerId") ?: "",
                )
            }
            socket?.on("match_cancelled") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onMatchCancelled(
                    data?.optString("matchId") ?: "",
                    data?.optString("reason"),
                )
            }
            socket?.on("match_expired") { args ->
                val data = args.firstOrNull() as? JSONObject
                listener.onMatchExpired(
                    data?.optString("matchId") ?: "",
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

    interface SocketListener {
        fun onConnected()
        fun onDisconnected()
        fun onError(message: String)
        fun onMatchSearching()
        fun onMatchFound(matchId: String, peerId: String)
        fun onMatchCancelled(matchId: String, reason: String?)
        fun onMatchExpired(matchId: String, reason: String?)
    }
}
