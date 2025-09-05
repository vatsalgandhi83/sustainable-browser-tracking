const SCORING_RULES = {
  VISIT_GREEN_SITE: 10,
  VISIT_NON_GREEN_SITE: -5,
};

const BADGES = {
  ECO_STARTER: {
    name: "Eco Starter",
    threshold: 50,
    description: "You've begun your sustainable browsing journey!",
  },
  ECO_WARRIOR: {
    name: "Eco Warrior",
    threshold: 100,
    description: "A true champion of the green web.",
  },
  GREEN_STREAK: {
    name: "Green Streak",
    threshold: 250,
    description: "You're making a consistent, positive impact!",
  },
};

export function calculateNewScore(currentScore, isGreen) {
  if (isGreen) {
    return currentScore + SCORING_RULES.VISIT_GREEN_SITE;
  } else {
    return currentScore + SCORING_RULES.VISIT_NON_GREEN_SITE;
  }
}

export function checkBadgeUnlocks(score, currentBadges) {
  const newlyUnlocked = [];
  for (const badgeKey in BADGES) {
    const badge = BADGES[badgeKey];
    if (score >= badge.threshold && !currentBadges.includes(badge.name)) {
      newlyUnlocked.push(badge.name);
    }
  }
  return [...currentBadges, ...newlyUnlocked];
}
