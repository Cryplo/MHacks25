import { useEffect, useRef } from 'react';
import { useConnectionContext } from '../renderer/src/providers/ConnectionProvider';

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useWebSocket(ipAddress: string, id: number) {
  const socketRef = useRef<WebSocket | null>(null);
  const { hmacKey } = useConnectionContext();

  useEffect(() => {
    if (!ipAddress) return;

    const ws = new WebSocket(`ws://${ipAddress}:8000/ws/${id}`);
    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [ipAddress, id]);

  const sendCommandAndWait = async (command: string): Promise<string> => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !hmacKey) {
      throw new Error('WebSocket not ready or key missing');
    }

    // Generate HMAC of the command
    const encoder = new TextEncoder();
    const keyData = encoder.encode(hmacKey);
    const messageData = encoder.encode(command);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureHex = toHex(signature);

    const signedPayload = {
      username: "admin",
      command,
      signature: signatureHex,
    };

    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        socket.removeEventListener('message', handler);
        resolve(event.data);
      };

      socket.addEventListener('message', handler);
      socket.send(JSON.stringify(signedPayload));
    });
  };

  return { sendCommandAndWait };
}
