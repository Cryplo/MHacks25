// import Versions from './components/Versions'
// import electronLogo from './assets/electron.svg'
import { Terminal } from './components/Terminal.tsx'

function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Terminal />
    </>
  )
}

export default App
