// import Versions from './components/Versions'
// import electronLogo from './assets/electron.svg'
import { Terminal } from './Terminal'
import Tabs from './components/tab'

function App(): React.JSX.Element {
  const handleActiveTabChange = (tabId: string) => {
    // You can handle active tab changes here if needed
    console.log('Active tab changed to:', tabId)
  }

  return (
    <>
      <Tabs />
      <Terminal />
    </>
  )
}

export default App
