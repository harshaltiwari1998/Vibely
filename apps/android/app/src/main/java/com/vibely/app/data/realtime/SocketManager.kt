package com.vibely.app.data.realtime

import io.socket.client.IO
import io.socket.client.Socket
import java.net.URI

/**
 * Persistent, app-wide Socket.IO connections, one per namespace, shared by
 * every screen. Opening a fresh socket per screen (and disconnecting it on
 * navigation) makes the server's disconnect handler tear down whatever call
 * or match request was just starting, since it looks like the user went
 * offline - see the equivalent `lib/socket.ts` fix on the web client.
 */
object SocketManager {
    private var defaultSocket: Socket? = null
    private var defaultToken: String? = null

    private var signalSocket: Socket? = null
    private var signalToken: String? = null

    fun getDefaultSocket(baseUrl: String, accessToken: String): Socket {
        if (defaultSocket != null && defaultToken == accessToken) return defaultSocket!!
        defaultSocket?.disconnect()
        defaultToken = accessToken
        val options = IO.Options()
        options.auth = mapOf("token" to "Bearer $accessToken")
        options.transports = arrayOf("websocket")
        val sock = IO.socket(URI.create(baseUrl), options)
        sock.connect()
        defaultSocket = sock
        return sock
    }

    fun getSignalSocket(baseUrl: String, accessToken: String): Socket {
        if (signalSocket != null && signalToken == accessToken) return signalSocket!!
        signalSocket?.disconnect()
        signalToken = accessToken
        val options = IO.Options()
        options.auth = mapOf("token" to "Bearer $accessToken")
        options.transports = arrayOf("websocket")
        val sock = IO.socket(URI.create("$baseUrl/signal"), options)
        sock.connect()
        signalSocket = sock
        return sock
    }

    fun disconnectAll() {
        defaultSocket?.disconnect()
        defaultSocket = null
        defaultToken = null
        signalSocket?.disconnect()
        signalSocket = null
        signalToken = null
    }
}
