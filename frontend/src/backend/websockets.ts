import { useEffect, useRef } from 'react'

export function useWebSocket(ipAddress: string, id: number) {
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!ipAddress) return

    const ws = new WebSocket(`ws://${ipAddress}:8000/ws/${id}`)
    socketRef.current = ws

    // return () => {
    //   ws.close()
    // }
  }, [ipAddress])

  const sendCommandAndWait = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current

      if (socket?.readyState === WebSocket.OPEN) {
        const handler = (event: MessageEvent) => {
          socket.removeEventListener('message', handler)
          resolve(event.data)
        }
        socket.addEventListener('message', handler)
        socket.send(command)
      } else {
        reject('WebSocket is not open')
      }
    })
  }

  return { sendCommandAndWait }
}
