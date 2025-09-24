import "./App.css";
import { useEffect, useMemo, useState } from "react";

import { LikedArticleCard } from "./components/LikedArticleCard";
import { REACTIONS, reactionByKey, reactionLabelMap, type ReactionKey } from "./constants/reactions";
import { NewsCard } from "./components/NewsCard";
import { SanitizedHtml } from "./components/SanitizedHtml";
import { useArticleReaction } from "./hooks/useArticleReaction";
import { useNewsFeed } from "./hooks/useNewsFeed";

const MAX_VISIBLE_STACK = 4;
const MAX_STACK_DEPTH = MAX_VISIBLE_STACK - 1;
const MAX_FEED_ITEMS = 30;
const LIKES_ENDPOINT = "/api/articles/likes";

const TABS = [
  { key: "home", label: "Home" },
  { key: "likes", label: "Likes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  const { items, error, isLoading } = useNewsFeed();
  const {
    items: likedItems,
    error: likedError,
    isLoading: isLoadingLikes,
    refresh: refreshLikes,
  } = useNewsFeed(LIKES_ENDPOINT);

  const cappedItems = useMemo(() => items.slice(0, MAX_FEED_ITEMS), [items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastReaction, setLastReaction] = useState<{
    title: string;
    reaction: ReactionKey;
  } | null>(null);

  const { submitReaction, isSubmitting, error: reactionError } = useArticleReaction();

  useEffect(() => {
    setCurrentIndex(0);
    setLastReaction(null);
  }, [cappedItems]);

  const remainingItems = cappedItems.slice(currentIndex);
  const visibleStack = remainingItems.slice(0, MAX_VISIBLE_STACK);

  const handleRate = async (reactionKey: ReactionKey) => {
    const ratedItem = cappedItems[currentIndex];
    if (!ratedItem || isSubmitting) return;

    const reaction = reactionByKey[reactionKey];
    const succeeded = await submitReaction(ratedItem.id, reaction.value);
    if (!succeeded) return;

    setLastReaction({ title: ratedItem.title, reaction: reactionKey });
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, cappedItems.length));
    refreshLikes();
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "likes") {
      refreshLikes();
    }
  };

  const pageTitle = activeTab === "home" ? "最新ニュース" : "ライクされた記事";

  const renderHome = () => {
    if (error) return <div className="app-status">Error: {error}</div>;
    if (isLoading) return <div className="app-status">Loading...</div>;

    if (!remainingItems.length) {
      return (
        <div className="app-status app-status--inline">
          すべてのニュースをチェックしました
        </div>
      );
    }

    return (
      <>
        <div className="news-stack">
          {visibleStack.map((item, stackIndex) => (
            <NewsCard
              key={item.id}
              depth={Math.min(stackIndex, MAX_STACK_DEPTH)}
              isTop={stackIndex === 0}
            >
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="news-card__title"
              >
                {item.title}
              </a>
              <div className="news-card__source">{item.source}</div>
              <SanitizedHtml html={item.summary} className="news-card__summary" />
            </NewsCard>
          ))}
        </div>

        <div className="card-actions">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.key}
              type="button"
              className={`card-button card-button--${reaction.buttonModifier}`}
              onClick={() => handleRate(reaction.key)}
              disabled={isSubmitting}
            >
              {reaction.label}
            </button>
          ))}
        </div>

        {reactionError ? (
          <div className="card-actions__status card-actions__status--error" role="alert">
            リアクションの送信に失敗しました: {reactionError}
          </div>
        ) : null}

        {lastReaction ? (
          <div className="card-actions__status" aria-live="polite">
            {lastReaction.title} を {reactionLabelMap[lastReaction.reaction]} しました
          </div>
        ) : null}
      </>
    );
  };

  const renderLikes = () => {
    if (likedError) return <div className="app-status">Error: {likedError}</div>;
    if (isLoadingLikes) return <div className="app-status">Loading...</div>;

    if (!likedItems.length) {
      return (
        <div className="app-status app-status--inline">
          ライクされた記事がありません
        </div>
      );
    }

    return (
      <div className="liked-grid">
        {likedItems.map((item) => (
          <LikedArticleCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="app">
      <h1 className="app__title">{pageTitle}</h1>

      <div className="app__body">
        {activeTab === "home" ? renderHome() : renderLikes()}
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
