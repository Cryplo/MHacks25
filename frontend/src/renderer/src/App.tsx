// import Versions from './components/Versions'
// import electronLogo from './assets/electron.svg'
import { SettingsProvider } from './contexts/SettingsContext'
// src/App.tsx
import React, { useState } from 'react';
import { useConnectionContext } from './providers/ConnectionProvider';
import Tabs from './components/Tabs';

function App(): React.JSX.Element {
   const { setTargetIp, setHmacKey, isConfigured } = useConnectionContext();

   const [tempIp, setTempIp] = useState('');
   const [tempKey, setTempKey] = useState('');

  const handleSubmit = async () => {
    if (!tempIp || !tempKey) return;

    try {
      const username = "admin"; // Optional: make dynamic

      // Step 1: Request challenge from server
      const challengeRes = await fetch(`http://${tempIp}:8000/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!challengeRes.ok) {
        alert("Failed to get challenge");
        return;
      }
      console.log(tempKey);

      const { challenge } = await challengeRes.json();

      // Step 2: Generate HMAC using plaintext key
      const encoder = new TextEncoder();
      const keyData = encoder.encode(tempKey);
      const messageData = encoder.encode(challenge);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, messageData);

      // Convert signature (ArrayBuffer) to hex string
      const signatureHex = [...new Uint8Array(signature)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Step 3: Verify the HMAC response
      const verifyRes = await fetch(`http://${tempIp}:8000/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          challenge,
          response: signatureHex,
        }),
      });

      if (!verifyRes.ok) {
        alert("Authentication failed");
        return;
      }

      // Success
      setTargetIp(tempIp);
      setHmacKey(tempKey);
    } catch (error) {
      console.error("Auth error:", error);
      alert("An error occurred during authentication");
    }
  };

   if (!isConfigured) {
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
             placeholder="your_key_here"
             style={{ width: '100%', marginBottom: '1rem' }}
           />
         </label>

         <button
           onClick={handleSubmit}
           disabled={!tempIp || !tempKey}
           style={{ padding: '0.5rem 1rem' }}
         >
           Connect
         </button>
       </div>
     );
   }


  return (
    <SettingsProvider>
      <Tabs />
    </SettingsProvider>
  );
}

export default App;
