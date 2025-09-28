import { createContext, useContext, useState, ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'auto'

interface SettingsContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  fontSize: number
  setFontSize: (size: number) => void
  fontFamily: string
  setFontFamily: (family: string) => void
  terminalOpacity: number
  setTerminalOpacity: (opacity: number) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light')
  const [fontSize, setFontSize] = useState(14)
  const [fontFamily, setFontFamily] = useState('Consolas, monospace')
  const [terminalOpacity, setTerminalOpacity] = useState(0.9)

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        terminalOpacity,
        setTerminalOpacity
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}