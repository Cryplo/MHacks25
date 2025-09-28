import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import Store from 'electron-store';
import keytar from 'keytar';

const store = new Store(); // This is the correct instantiation
// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld("env", {
  platform: process.platform,
  async setTargetIp(ip: string) {
    store.set('targetIp', ip);
  },
  async getTargetIp(): Promise<string | null> {
    return store.get('targetIp', null);
  },
  async setHmacKey(key: string) {
    await keytar.setPassword(SERVICE_NAME, 'hmacKey', key);
  },
  async getHmacKey(): Promise<string | null> {
    return await keytar.getPassword(SERVICE_NAME, 'hmacKey');
  },
  async clearAll() {
    store.clear();
    await keytar.deletePassword(SERVICE_NAME, 'hmacKey');
  } // <- this works fine here
});
