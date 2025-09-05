const SCORING_RULES = {
  VISIT_GREEN_SITE: 10,
  VISIT_NON_GREEN_SITE: -5,
};

/**
 * Defines the badges and the points required to unlock them.
 */

const BADGES = {
  ECO_STARTER: {
    name: "Eco Starter",
    threshold: 50,
    description: "You've begun your sustainable browsing journey!"
  },
  ECO_WARRIOR: {
    name: "Eco Warrior",
    threshold: 100,
    description: "A true champion of the green web."
  },
  GREEN_STREAK: {
    name: "Green Streak",
    threshold: 250,
    description: "You're making a consistent, positive impact!"
  }
};

/**
 * Calculates the new score based on a browsing action.
 * @param {number} currentScore - The user's current score.
 * @param {boolean} isGreen - Whether the visited site is green-hosted.
 * @returns {number} The updated score.
 */

export function calculateNewScore(currentScore, isGreen) {
  if (isGreen) {
    return currentScore + SCORING_RULES.VISIT_GREEN_SITE;
  } else {
    return currentScore + SCORING_RULES.VISIT_NON_GREEN_SITE;
  }
}

/**
 * Checks which badges the user has earned based on their score.
 * @param {number} score - The user's current score.
 * @param {Array<string>} currentBadges - An array of badge names the user already has.
 * @returns {Array<string>} An updated array of earned badge names.
 */

export function checkBadgeUnlocks(score, currentBadges) {
  const newlyUnlocked = [];
  for (const badgeKey in BADGES) {
    const badge = BADGES[badgeKey];
    if (score >= badge.threshold && !currentBadges.includes(badge.name)) {
      newlyUnlocked.push(badge.name);
    }
  }
  // Return a combined list of old and new badges
  return [...currentBadges, ...newlyUnlocked];
}