import React, { useState, useEffect, useRef } from 'react'
import { CommandToDescription, LanguageToCommand } from "../../../backend/translator"
import { CreateSocket } from '../../../backend/websockets'

export default function Terminal(): React.JSX.Element {
  const [currentCommand, setCurrentCommand] = useState('')

  const [commandHistory, setCommandHistory] = useState([])

  const [historyIndex, setHistoryIndex] = useState(-1)

  const [isProcessing, setIsProcessing] = useState(false)

  const inputRef = useRef(null)

  const outputRef = useRef(null)

  const processorRef = useRef(null)

  useEffect(
    () => {
      CreateSocket();
    }
  )

  const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void> = async (e) => {
    if (e.key === 'Enter') {
      if (currentCommand.trim()) {
        setIsProcessing(true)

        const shellCommand = await LanguageToCommand(currentCommand)

        console.log(await CommandToDescription(shellCommand))

        console.log('Shell command:', shellCommand)

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
    <div className="h-96 overflow-y-auto p-4 terminal-grid font-mono text-sm dark:bg-black dark:text-white">
      {/* Current Input Line */}

      <div className="flex items-center">
        <span className="text-terminal-prompt mr-2">$</span>

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
  )
}
