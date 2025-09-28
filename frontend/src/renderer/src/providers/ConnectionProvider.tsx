// src/providers/ConnectionProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConnectionContextType {
  targetIp: string | null;
  hmacKey: string | null;
  setTargetIp: (ip: string) => void;
  setHmacKey: (key: string) => void;
  isConfigured: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  ip: 'app:targetIp',
  hmac: 'app:hmacKey',
};

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [targetIp, setTargetIpState] = useState<string | null>(null);
  const [hmacKey, setHmacKeyState] = useState<string | null>(null);

  // Load from localStorage on first mount
  useEffect(() => {
    const storedIp = localStorage.getItem(LOCAL_STORAGE_KEYS.ip);
    const storedHmac = localStorage.getItem(LOCAL_STORAGE_KEYS.hmac);

    if (storedIp) setTargetIpState(storedIp);
    if (storedHmac) setHmacKeyState(storedHmac);
  }, []);

  // Save to localStorage whenever these are set
  const setTargetIp = (ip: string) => {
    setTargetIpState(ip);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ip, ip);
  };

  const setHmacKey = (key: string) => {
    setHmacKeyState(key);
    localStorage.setItem(LOCAL_STORAGE_KEYS.hmac, key);
  };

  const isConfigured = Boolean(targetIp && hmacKey);

  return (
    <ConnectionContext.Provider
      value={{ targetIp, hmacKey, setTargetIp, setHmacKey, isConfigured }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnectionContext = (): ConnectionContextType => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider');
  }
  return context;
};
