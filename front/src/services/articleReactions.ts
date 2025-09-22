import { postJson } from "../utils/apiClient";

export async function postArticleReaction(articleId: number, value: number): Promise<void> {
  await postJson(`/api/articles/${articleId}/reaction`, { value });
}
