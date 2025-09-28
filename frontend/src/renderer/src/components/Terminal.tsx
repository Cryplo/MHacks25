import React, { useState, useRef } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { CommandToDescription, LanguageToCommand } from "../../../backend/translator"
import { useWebSocket } from '../../../backend/websockets'
import { useConnectionContext } from '../providers/ConnectionProvider'
import './Terminal.css'

export default function Terminal({ tabId }): React.JSX.Element {
  const { theme, fontSize, fontFamily, terminalOpacity } = useSettings()

  const [currentCommand, setCurrentCommand] = useState('')
  const [currentWorkingDirectory, setCurrentWorkingDirectory] = useState('')

  const [totalHistory, setTotalHistory] = useState([])
  const { targetIp } = useConnectionContext()
  const { sendCommandAndWait } = useWebSocket(targetIp, tabId)

  const [commandHistory, setCommandHistory] = useState([])

  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isProcessing, setIsProcessing] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Apply theme-based styling
  const getThemeStyles = (): { backgroundColor: string; color: string; opacity: number } => {
    const isDark =
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    return {
      backgroundColor: isDark ? '#000000' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
      opacity: terminalOpacity
    }
  }

  const processorRef = useRef(null)

  const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void> = async (e) => {
    if (e.key === 'Enter') {
      if (currentCommand.trim()) {
        setIsProcessing(true)

        // const shellCommand = await LanguageToCommand(currentCommand)
        // console.log(await CommandToDescription(shellCommand))
        try{
          const response = await Promise.race([sendCommandAndWait(currentCommand), new Promise((_, reject) => setTimeout( () => reject(new Error("Query Timed Out")), 10000))]);
          const responseObject = JSON.parse(response)
          if (responseObject.exit_code) setCurrentWorkingDirectory(responseObject.cwd)
          setTotalHistory((prev) => [
            ...prev,
            currentCommand,
            responseObject.exit_code ? responseObject.output : 'Error'
          ])
        }catch{
          setTotalHistory((prev) => [
            ...prev,
            currentCommand,
            "Query Timed Out" 
          ])
        }
        setCommandHistory((prev) => [...prev, currentCommand])
        setCurrentCommand('')
        setHistoryIndex(-1) // Reset history index when new command is entered
        
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

  const themeStyles = getThemeStyles()

  return (
    <div className="terminal" style={themeStyles}>
      <div 
        className="terminal-output"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          color: themeStyles.color
        }}
      >
        {totalHistory.map((command, index) => (
          <div
            key={index}
            className={`terminal-command${index === 2 * historyIndex ? ' selected' : ''}`}
            style={{
              color: themeStyles.color,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily
            }}
          >
            {index % 2 ? '>' : '$'} {command}
          </div>
        ))}
      </div>

      <div className="terminal-input" style={{ backgroundColor: themeStyles.backgroundColor }}>
        <div className="flex items-center">
          <span
            className="text-terminal-prompt mr-2"
            style={{
              color: themeStyles.color,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily
            }}
          >
            $
          </span>

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
            style={{
              color: themeStyles.color,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              backgroundColor: 'transparent'
            }}
          />
        </div>
      </div>
    </div>
  )
}
