import { useState, useEffect } from 'react';
import  Terminal  from '../Terminal';
import './Tabs.css';

interface Tabs {
  id: string
  terminal: typeof Terminal
  title: string
}

interface TabsProps {
  onActiveTabChange?: (tabId: string) => void
}

const Tabs: React.FC<TabsProps> = ({ onActiveTabChange }) => {
  const [tabs, setTabs] = useState<Tabs[]>([]);
  const [activeTabId, setActiveTabId] = useState('');

  useEffect(() => {
    if (tabs.length === 0) {
      handleNewTab();
    }
  }, []);

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
    // Find the highest numeric ID, or default to 0 if no valid IDs exist
    const existingIds = tabs.map((t) => parseInt(t.id, 10)).filter((id) => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newTabId = (maxId + 1).toString();
    const newTab = { id: newTabId, title: `user@user ${newTabId}` };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
    onActiveTabChange?.(newTabId);
  };

  return (
    <div className="tabs-container">
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
        <button className="new-tab-button" onClick={handleNewTab}>
          +
        </button>
      </div>
      <div className="tab-content">
        <Terminal></Terminal>
      </div>
    </div>
  );
};

export default Tabs;
