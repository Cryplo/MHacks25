// import Versions from './components/Versions'
// import electronLogo from './assets/electron.svg'
import Tabs from './components/Tabs'
import { SettingsProvider } from './contexts/SettingsContext'

function App(): React.JSX.Element {

  return (
    <SettingsProvider>
      <Tabs />
    </SettingsProvider>
  )
}

export default App
