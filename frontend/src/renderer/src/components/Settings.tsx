import React from 'react'
import { useSettings, Theme } from '../contexts/SettingsContext'
import './Settings.css'

const Settings: React.FC = () => {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    terminalOpacity,
    setTerminalOpacity
  } = useSettings()

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme)
  }

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(parseInt(e.target.value))
  }

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value)
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerminalOpacity(parseFloat(e.target.value))
  }

  return (
    <div className="settings-background">
      <div className="settings-container">
        <h2 className="settings-title">Settings</h2>

        <div className="settings-section">
          <h3 className="section-title">Appearance</h3>

          <div className="setting-item">
            <label htmlFor="theme-select" className="setting-label">
              Theme:
            </label>
            <select
              id="theme-select"
              value={theme}
              onChange={handleThemeChange}
              className="setting-select"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="opacity-slider" className="setting-label">
              Terminal Opacity: {Math.round(terminalOpacity * 100)}%
            </label>
            <input
              id="opacity-slider"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={terminalOpacity}
              onChange={handleOpacityChange}
              className="setting-slider"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Terminal</h3>

          <div className="setting-item">
            <label htmlFor="font-size-input" className="setting-label">
              Font Size:
            </label>
            <input
              id="font-size-input"
              type="number"
              min="8"
              max="32"
              value={fontSize}
              onChange={handleFontSizeChange}
              className="setting-input"
            />
            <span className="setting-unit">px</span>
          </div>

          <div className="setting-item">
            <label htmlFor="font-family-select" className="setting-label">
              Font Family:
            </label>
            <select
              id="font-family-select"
              value={fontFamily}
              onChange={handleFontFamilyChange}
              className="setting-select"
            >
              <option value="Consolas, monospace">Consolas</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Monaco, monospace">Monaco</option>
              <option value="'Lucida Console', monospace">Lucida Console</option>
              <option value="Menlo, monospace">Menlo</option>
              <option value="'Source Code Pro', monospace">Source Code Pro</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Preview</h3>
          <div
            className="terminal-preview"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              opacity: terminalOpacity
            }}
          >
            <div className="preview-line">user@user:~$ echo "Hello World"</div>
            <div className="preview-line">Hello World</div>
            <div className="preview-line">user@user:~$ </div>
            {/* <span className="cursor">█</span> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings