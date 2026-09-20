package com.vibely.app.data.realtime

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URI

data class LiveChatEntry(val userId: String, val username: String, val content: String)
data class LiveGiftEvent(val senderName: String, val giftName: String, val iconUrl: String)

/**
 * Thin wrapper around the real Socket.IO client for the backend's `/live`
 * namespace (viewer counts, live chat, live gifting). Distinct from
 * [WebSocketManager], which speaks raw WebSocket frames and cannot complete
 * a real Socket.IO handshake against the NestJS gateway.
 */
class LiveSocketSession(
    private val baseUrl: String,
    private val accessToken: String,
    private val roomId: String,
) {
    private var socket: Socket? = null

    var onViewerCountChanged: ((Int) -> Unit)? = null
    var onChatMessage: ((LiveChatEntry) -> Unit)? = null
    var onGift: ((LiveGiftEvent) -> Unit)? = null
    var onLiveEnded: (() -> Unit)? = null

    fun connect() {
        val options = IO.Options()
        options.auth = mapOf("token" to "Bearer $accessToken")
        options.transports = arrayOf("websocket")

        val sock = IO.socket(URI.create("$baseUrl/live"), options)
        socket = sock

        sock.on(Socket.EVENT_CONNECT) {
            sock.emit("live_join", JSONObject().put("roomId", roomId))
        }
        sock.on("live_viewer_joined") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onViewerCountChanged?.invoke(data.optInt("viewerCount", 0))
        }
        sock.on("live_viewer_left") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onViewerCountChanged?.invoke(data.optInt("viewerCount", 0))
        }
        sock.on("live_chat_message") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onChatMessage?.invoke(
                LiveChatEntry(
                    userId = data.optString("userId"),
                    username = data.optString("username"),
                    content = data.optString("content"),
                )
            )
        }
        sock.on("live_gift_sent") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onGift?.invoke(
                LiveGiftEvent(
                    senderName = data.optString("senderName"),
                    giftName = data.optString("giftName"),
                    iconUrl = data.optString("iconUrl"),
                )
            )
        }
        sock.on("live_ended") { onLiveEnded?.invoke() }

        sock.connect()
    }

    fun sendChat(content: String) {
        socket?.emit("live_chat_message", JSONObject().put("roomId", roomId).put("content", content))
    }

    fun sendGift(giftId: String) {
        socket?.emit("live_gift_sent", JSONObject().put("roomId", roomId).put("giftId", giftId))
    }

    fun close() {
        socket?.emit("live_leave", JSONObject().put("roomId", roomId))
        socket?.disconnect()
        socket?.off()
        socket = null
    }
}
