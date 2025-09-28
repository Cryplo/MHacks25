// src/providers/ConnectionProvider.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface ConnectionContextType {
  targetIp: string | null;
  hmacKey: string | null;
  setTargetIp: (ip: string) => void;
  setHmacKey: (key: string) => void;
  isConfigured: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [targetIp, setTargetIp] = useState<string | null>(null);
  const [hmacKey, setHmacKey] = useState<string | null>(null);

  const isConfigured = Boolean(targetIp && hmacKey);

  return (
    <ConnectionContext.Provider value={{ targetIp, hmacKey, setTargetIp, setHmacKey, isConfigured }}>
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
