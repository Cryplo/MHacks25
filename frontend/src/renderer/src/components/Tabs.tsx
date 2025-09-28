import { useState, useEffect, JSX } from 'react'
import Terminal from './Terminal';
import './Tabs.css';
import settingsIcon from '../../../../resources/settings.png'


interface Tabs {
  id: string;
  title: string;
  component: JSX.Element; // Store an instance of Terminal
}

interface TabsProps {
  onActiveTabChange?: (tabId: string) => void
}

const Tabs: React.FC<TabsProps> = ({ onActiveTabChange }) => {
  const [tabs, setTabs] = useState<Tabs[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [isAddTabHidden, setIsAddTabHidden] = useState(false);
  const [isSettingsHidden, setIsSettingsHidden] = useState(true);

  useEffect(() => {
    if (tabs.length === 0) {
      handleNewTab();
    }
  }, []);

  const handleSettingsClick = () => {
    setIsSettingsHidden(!isSettingsHidden);
  };

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    onActiveTabChange?.(tabId);
  };

  const handleTabClose = (tabId: string) => {
    if (tabs.length <= 1) {
      return;
    }
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    // Show the button again if we go below 10 tabs
    if (newTabs.length < 10) {
      setIsAddTabHidden(false);
    }

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const newActiveId = newTabs[0].id;
        setActiveTabId(newActiveId);
        onActiveTabChange?.(newActiveId);
      } else {
        // When the last tab is closed, reset the active tab ID
        setActiveTabId('');
        onActiveTabChange?.('');
      }
    }
  };

  const handleNewTab = () => {
    if (tabs.length >= 10) {
      setIsAddTabHidden(true)
      return;
    }
    setIsSettingsHidden(true)

    const existingIds = tabs.map((t) => parseInt(t.id, 10)).filter((id) => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newTabId = (maxId + 1).toString();
    const newTab: Tabs = {
      id: newTabId,
      title: `user@user ${newTabId}`,
      component: <Terminal key={newTabId} tabId={newTabId} />
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
    onActiveTabChange?.(newTabId);
  };

  return (
    <div>
      <div
        className="tabs-container">
        <div className="tabs-list">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="tab-title">{tab.title}</span>
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTabClose(tab.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="new-tab-button"
            onClick={handleNewTab}
            style={{ visibility: isAddTabHidden ? 'hidden' : 'visible' }}
          >
            +
          </button>
        </div>
      </div>
      <button
        className="settings-button"
        onClick={handleSettingsClick}
      >
        <img
          src={settingsIcon}
          alt="Settings"
          className="settings-icon"
        />
      </button>
      <div className="tab-content"
        style={{ display: isSettingsHidden ? 'block' : 'none' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
            className="terminal-wrapper"
          >
            <Terminal />
          </div>
        ))}
      </div>
      <div className="settings-page"
        style={{ display: isSettingsHidden ? 'none' : 'block' }}
      >

      </div>
    </div>
  );
};

export default Tabs;
