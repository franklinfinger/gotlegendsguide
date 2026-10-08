/** A self-inflicted FIRE effect is not evidence that the champion burns enemies. */
export function isSelfOnlyFireApplication(fact) {
  if (fact?.mechanicId !== 'apply_fire') return false;
  const wording = String(fact.factText || '');
  return /\b(?:apply|afflict|inflict)\b[^.!?]{0,45}\bFIRE\b[^.!?]{0,45}\b(?:on himself|on herself|on themselves|to self)\b/i.test(wording)
    && !/\b(?:enemies|enemy|target|foe)\b[^.!?]{0,90}\bFIRE\b/i.test(wording);
}
