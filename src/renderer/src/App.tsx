// src/App.tsx
import React, { useState } from 'react';
import { useConnectionContext } from './providers/ConnectionProvider';
import Tabs from './components/Tabs';

function App(): React.JSX.Element {
  const { setTargetIp, setHmacKey, isConfigured } = useConnectionContext();

  const [tempIp, setTempIp] = useState('');
  const [tempKey, setTempKey] = useState('');

  const handleSubmit = (): void => {
    setTargetIp(tempIp);
    setHmacKey(tempKey);
  };

  if (!isConfigured) {
    // Render setup screen if not configured
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
        <h2>Set Connection Details</h2>

        <label>
          Target IP:
          <input
            type="text"
            value={tempIp}
            onChange={(e) => setTempIp(e.target.value)}
            placeholder="127.0.0.1"
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </label>

        <label>
          HMAC Key (Base64):
          <input
            type="text"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            placeholder="your_base64_encoded_key_here"
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </label>

        <button onClick={handleSubmit} style={{ padding: '0.5rem 1rem' }}>
          Connect
        </button>
      </div>
    );
  }

  // Once configured, show the real app
  return <Tabs />;
}

export default App;
