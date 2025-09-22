export const REACTIONS = [
  {
    key: "like",
    label: "Like",
    value: 1,
    buttonModifier: "like",
  },
  {
    key: "nop",
    label: "nop",
    value: -1,
    buttonModifier: "nop",
  },
] as const;

export type ReactionOption = (typeof REACTIONS)[number];
export type ReactionKey = ReactionOption["key"];

export const reactionByKey: Record<ReactionKey, ReactionOption> = REACTIONS.reduce(
  (acc, reaction) => {
    acc[reaction.key] = reaction;
    return acc;
  },
  {} as Record<ReactionKey, ReactionOption>
);

export const reactionLabelMap: Record<ReactionKey, string> = REACTIONS.reduce(
  (acc, reaction) => {
    acc[reaction.key] = reaction.label;
    return acc;
  },
  {} as Record<ReactionKey, string>
);
