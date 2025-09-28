import { useEffect, useRef } from "react"
import { WebSocket } from "ws" 

export function useWebSocket(){
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    socketRef.current = ws;
    return () => ws.close();
  })
  const sendCommand = (command: string) => {
    if(socketRef.current?.readyState === WebSocket.OPEN){
      socketRef.current.send(command);
    }  
  }
  return { sendCommand };
}