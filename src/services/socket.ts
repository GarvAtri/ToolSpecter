import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

let socket: Socket | null = null;

export const socketClient = {
  async connect() {
    const token = await SecureStore.getItemAsync('auth_token');
    socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000', {
      auth:      { token },
      transports:['websocket'],
    });
    socket.on('connect',    () => console.log('[Socket] Connected'));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    return socket;
  },

  emit(event: string, data: any) {
    socket?.emit(event, data);
  },

  on(event: string, cb: (data: any) => void) {
    socket?.on(event, cb);
    return () => socket?.off(event, cb);
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  },
};
