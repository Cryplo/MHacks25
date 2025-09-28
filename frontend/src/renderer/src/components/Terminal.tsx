import React, { useState, useRef } from 'react'
import { CommandToDescription, LanguageToCommand } from "../../../backend/translator"
import { useWebSocket } from "../../../backend/websockets";
import { useConnectionContext } from "../providers/ConnectionProvider";
import './Terminal.css'

export default function Terminal({ tabId }): React.JSX.Element {
  const [currentCommand, setCurrentCommand] = useState('')
  const [currentWorkingDirectory, setCurrentWorkingDirectory] = useState('')

  const [totalHistory, setTotalHistory] = useState([])
  const { targetIp } = useConnectionContext();
  const { sendCommandAndWait } = useWebSocket(targetIp, tabId);

  const [commandHistory, setCommandHistory] = useState([])

  const [historyIndex, setHistoryIndex] = useState(-1)

  const [isProcessing, setIsProcessing] = useState(false)

  const inputRef = useRef(null)

  const outputRef = useRef(null)

  const processorRef = useRef(null)


  const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void> = async (e) => {
    if (e.key === 'Enter') {
      if (currentCommand.trim()) {
        setIsProcessing(true)

        // const shellCommand = await LanguageToCommand(currentCommand)

        // console.log(await CommandToDescription(shellCommand))
        const response = await sendCommandAndWait(currentCommand)
        const responseObject = JSON.parse(response)
        if(!responseObject.exit_code) setCurrentWorkingDirectory(responseObject.cwd);

        setCommandHistory(prev => [...prev, currentCommand])
        setTotalHistory(prev => [...prev, currentCommand, responseObject.exit_code ? "Error" : responseObject.output])
        setCurrentCommand('')
        setHistoryIndex(-1) // Reset history index when new command is entered

        // console.log('Shell command:', currentCommand)

        setIsProcessing(false)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()

      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)

        setHistoryIndex(newIndex)

        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()

      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1

        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)

          setCurrentCommand('')
        } else {
          setHistoryIndex(newIndex)

          setCurrentCommand(commandHistory[newIndex])
        }
      }
    }
  }

  return (
    <div className="terminal">
      <div className="terminal-output">
        {totalHistory.map((command, index) => (
          <div key={index} className={`terminal-command${index === historyIndex ? " selected" : ""}`}>$ {command}</div>
        ))}
      </div>

      <div className="terminal-input">
        <div className="flex items-center">
          <span className="text-terminal-prompt mr-2">{currentWorkingDirectory} $</span>

          <input
            type="text"
            ref={inputRef}
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1 bg-transparent border-none outline-none text-terminal-text font-mono"
            placeholder="Type a wishes..."
            autoComplete="off"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
