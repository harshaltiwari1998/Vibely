package com.vibely.app.data.realtime

import com.vibely.app.data.remote.dto.PartySeatResponse
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONArray
import org.json.JSONObject
import java.net.URI

data class PartyChatEntry(val userId: String, val username: String, val content: String)

/**
 * Thin wrapper around the real Socket.IO client for the backend's `/party`
 * namespace (member counts, seat updates, room chat, and the seat-token
 * hand-off used when a listener is promoted to a speaker).
 */
class PartySocketSession(
    private val baseUrl: String,
    private val accessToken: String,
    private val roomId: String,
) {
    private var socket: Socket? = null

    var onMemberCountChanged: ((Int) -> Unit)? = null
    var onSeatsUpdated: ((List<PartySeatResponse>) -> Unit)? = null
    var onSeatToken: ((String) -> Unit)? = null
    var onChatMessage: ((PartyChatEntry) -> Unit)? = null
    var onPartyEnded: (() -> Unit)? = null

    fun connect() {
        val options = IO.Options()
        options.auth = mapOf("token" to "Bearer $accessToken")
        options.transports = arrayOf("websocket")

        val sock = IO.socket(URI.create("$baseUrl/party"), options)
        socket = sock

        sock.on(Socket.EVENT_CONNECT) {
            sock.emit("party_join", JSONObject().put("roomId", roomId))
        }
        sock.on("party_member_joined") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onMemberCountChanged?.invoke(data.optInt("memberCount", 0))
        }
        sock.on("party_member_left") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onMemberCountChanged?.invoke(data.optInt("memberCount", 0))
        }
        sock.on("party_seat_updated") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            val seatsJson = data.optJSONArray("seats") ?: JSONArray()
            val seats = (0 until seatsJson.length()).map { i ->
                val s = seatsJson.getJSONObject(i)
                PartySeatResponse(
                    seatIndex = s.optInt("seatIndex"),
                    userId = s.optString("userId"),
                    username = s.optString("username"),
                    avatarUrl = if (s.isNull("avatarUrl")) null else s.optString("avatarUrl"),
                    muted = s.optBoolean("muted", false),
                )
            }
            onSeatsUpdated?.invoke(seats)
        }
        sock.on("party_seat_token") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onSeatToken?.invoke(data.optString("token"))
        }
        sock.on("party_chat_message") { args ->
            val data = args.getOrNull(0) as? JSONObject ?: return@on
            onChatMessage?.invoke(
                PartyChatEntry(
                    userId = data.optString("userId"),
                    username = data.optString("username"),
                    content = data.optString("content"),
                )
            )
        }
        sock.on("party_ended") { onPartyEnded?.invoke() }

        sock.connect()
    }

    fun sendChat(content: String) {
        socket?.emit("party_chat_message", JSONObject().put("roomId", roomId).put("content", content))
    }

    fun takeSeat(seatIndex: Int) {
        socket?.emit("party_take_seat", JSONObject().put("roomId", roomId).put("seatIndex", seatIndex))
    }

    fun leaveSeat() {
        socket?.emit("party_leave_seat", JSONObject().put("roomId", roomId))
    }

    fun toggleMute(muted: Boolean) {
        socket?.emit("party_toggle_mute", JSONObject().put("roomId", roomId).put("muted", muted))
    }

    fun close() {
        socket?.emit("party_leave", JSONObject().put("roomId", roomId))
        socket?.disconnect()
        socket?.off()
        socket = null
    }
}
