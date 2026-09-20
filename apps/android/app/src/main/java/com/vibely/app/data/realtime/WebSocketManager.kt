package com.vibely.app.data.realtime

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

data class RealtimeEvent(val event: String, val payload: JsonObject)

class WebSocketManager(
    private val baseUrl: String = "ws://192.168.29.48:4000",
    private val token: String?,
    private val userId: String?
) {
    private val client = OkHttpClient()
    private var webSocket: WebSocket? = null
    private val gson = Gson()

    private val _events = MutableSharedFlow<RealtimeEvent>(replay = 0)
    val events = _events.asSharedFlow()

    fun connect() {
        val url = if (token != null) {
            "$baseUrl/socket.io/?token=$token"
        } else {
            "$baseUrl/socket.io/"
        }
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                Log.d("WebSocket", "Connected: ${response.code}")
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val json = gson.fromJson(text, JsonObject::class.java)
                    val event = json.get("event")?.asString ?: json.get("type")?.asString ?: ""
                    val payload = (json.get("payload") ?: json.get("data"))?.asJsonObject ?: JsonObject()
                    kotlinx.coroutines.runBlocking {
                        _events.emit(RealtimeEvent(event, payload))
                    }
                } catch (e: Exception) {
                    Log.e("WebSocket", "Parse error: ${e.message}")
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                Log.e("WebSocket", "Failure: ${t.message}")
                _events.tryEmit(RealtimeEvent("disconnect", JsonObject()))
            }
        })
    }

    fun emit(event: String, payload: JsonObject) {
        val msg = JsonObject().apply {
            addProperty("event", event)
            if (userId != null) addProperty("userId", userId)
            add("payload", payload)
        }
        webSocket?.send(gson.toJson(msg))
    }

    fun disconnect() {
        webSocket?.close(1000, "disconnect")
        webSocket = null
    }
}
