import { useEffect, useRef } from "react"

export function useWebSocket(){
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    socketRef.current = ws;
    return () => ws.close();
  })
  const sendCommandAndWait = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if(socketRef.current?.readyState === WebSocket.OPEN){
        const handler = (event: MessageEvent) => {
          socketRef.current.removeEventListener("message", handler);
          resolve(event.data);
        }
        socketRef.current.addEventListener("message", handler);
        socketRef.current.send(command);
      }
      else{
        reject("Web Socket is not open")
      }
    });
  }
  return { sendCommandAndWait };
}