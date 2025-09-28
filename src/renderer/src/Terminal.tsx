export default function Terminal(): React.JSX.Element {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-terminal-bg border border-terminal-border rounded-lg overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-sm text-muted-foreground ml-4 font-mono">Terminal</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Terminal Content */}
        <div className="h-96 overflow-y-auto p-4 terminal-grid font-mono text-sm">
          {/* Current Input Line */}
          <div className="flex items-center">
            <span className="text-terminal-prompt mr-2">$</span>
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-terminal-text font-mono"
              placeholder="Type a command..."
              autoComplete="off"
              spellCheck={false}
            />
            <span className="terminal-cursor text-terminal-cursor">|</span>
            werweqrqwerwqe
          </div>
        </div>
      </div>
    </div>
  )
}
