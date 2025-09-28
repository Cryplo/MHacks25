import { WebSocket } from "ws" 

var socket: WebSocket;

export function CreateSocket() {
  socket = new WebSocket("ws://localhost:8000/ws")

  socket.onopen = () => {
  }

  socket.onmessage = (event) => {
  }
}

const sendCommand = async (command) => {
  socket.send(command)
};