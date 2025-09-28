import { useEffect, useRef } from "react"
import { WebSocket } from "ws" 

export function useWebSocket(){
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    socketRef.current = ws;
    return () => ws.close();
  })
  const sendCommandAndWait = (command: string): Promise<string> => {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        socketRef.current.removeEventListener("message", handler);
        resolve(event.data);
      }
      socketRef.current.addEventListener("message", handler);
      socketRef.current.send(command);
    });
  }
  return { sendCommandAndWait };
}