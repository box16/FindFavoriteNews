import { useCallback, useState } from "react";

import { postArticleReaction } from "../services/articleReactions";

export function useArticleReaction() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitReaction = useCallback(async (articleId: number, value: number) => {
    setIsSubmitting(true);
    setError("");

    try {
      await postArticleReaction(articleId, value);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "failed";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitReaction,
    isSubmitting,
    error,
  } as const;
}
