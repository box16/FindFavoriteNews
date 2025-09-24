import "./App.css";
import { useCallback, useState } from "react";

import { HomeTab } from "./features/home/HomeTab";
import { LikesTab } from "./features/likes/LikesTab";

type TabKey = "home" | "likes";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "likes", label: "Likes" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [likesEnabled, setLikesEnabled] = useState(false);
  const [likesReloadToken, setLikesReloadToken] = useState(0);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "likes") {
      setLikesEnabled(true);
    }
  }, []);

  const handleReactionComplete = useCallback((value: number) => {
    if (value === 1) {
      setLikesReloadToken((token) => token + 1);
    }
  }, []);

  const pageTitle = activeTab === "home" ? "Latest News" : "Liked Articles";

  return (
    <div className="app">
      <h1 className="app__title">{pageTitle}</h1>

      <div className="app__body">
        {activeTab === "home" ? (
          <HomeTab onReactionComplete={handleReactionComplete} />
        ) : (
          <LikesTab
            isActive={activeTab === "likes"}
            shouldLoad={likesEnabled}
            reloadToken={likesReloadToken}
          />
        )}
      </div>

      <nav className="app-tabs" aria-label="Switch view">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`app-tabs__button${activeTab === tab.key ? " app-tabs__button--active" : ""}`}
            onClick={() => handleTabChange(tab.key)}
            aria-current={activeTab === tab.key ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
