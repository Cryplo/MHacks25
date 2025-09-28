import { Input } from "./ui/input";
import React, { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { ScrollArea } from "./ui/scroll-area";

export function Shell({ shellId }): React.JSX.Element {
  const [input, setInput] = useState("");

  const [totalHistory, setTotalHistory] = useState<string[]>([]);
  // const { targetIp } = useConnectionContext();

  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const [socketUrl, setSocketUrl] = useState(
    `ws://localhost:8000/ws/${shellId}`,
  );
  const { sendMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl);

  useEffect(() => {
    if (lastJsonMessage !== null) {
      setTotalHistory((prev) => [...prev, lastJsonMessage.output]);
    }
  }, [lastJsonMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (input.trim()) {
        console.log("Sending input:", input);
        sendMessage(input);
        setCommandHistory((prev) => [...prev, input]);
        setTotalHistory((prev) => [...prev, input]);
        setInput("");
      }
    }
  };
  return (
    <div className="flex flex-col justify-end w-full h-full p-4 space-y-2 overflow-y-auto">
      <div className="h-[420px] overflow-y-auto w-full">
        <div className="flex h-full w-full flex-col justify-end">
          {totalHistory.map((line, index) => {
            if (index != 0) {
              return (
                <span key={index} className="w-full whitespace-pre-wrap">
                  {line}
                  <br />
                </span>
              );
            }
          })}
        </div>
      </div>
      <div className="flex w-full items-center">
        <span className="mr-2">$</span>
        <Input
          className="w-full focus-visible:border-0 ring-0 focus-visible:ring-0 border-t shadow-none focus-visible:shadow-none"
          placeholder="Type a command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          // disabled={readyState !== ReadyState.OPEN}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
