/**
 * Centralized reward configuration
 * This file contains all business logic for reward amounts and bundle distribution
 */

export const REWARD_CONFIG = {
  // SKU weight to reward mapping
  skuRewards: {
    "340g": {
      displayAmount: 100, // MB shown to customer
      bundleSize: "50MB",
      bundleCount: 2, // Send 2x50MB = 100MB
      description: "100MB Safaricom Data Bundle",
    },
    "500g": {
      displayAmount: 150, // MB shown to customer
      bundleSize: "50MB",
      bundleCount: 3, // Send 3x50MB = 150MB
      description: "150MB Safaricom Data Bundle",
    },
  },

  // Default reward if SKU weight not recognized
  default: {
    bundleSize: "50MB",
    bundleCount: 1,
  },
} as const

/**
 * Get reward configuration for a given SKU weight
 */
export function getRewardConfig(weight: string) {
  const normalizedWeight = weight.toLowerCase().trim()

  if (normalizedWeight === "340g") {
    return REWARD_CONFIG.skuRewards["340g"]
  }

  if (normalizedWeight === "500g") {
    return REWARD_CONFIG.skuRewards["500g"]
  }

  return null
}

/**
 * Calculate displayed reward amount based on SKU weight
 */
export function calculateDisplayedReward(weight: string, baseAmount: number): number {
  const config = getRewardConfig(weight)
  return config?.displayAmount ?? baseAmount
}
