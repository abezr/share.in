/**
 * Quota Monitor for tracking AI usage and availability
 * Manages local and peer quota status for intelligent task delegation
 */
class QuotaMonitor {
  constructor(options = {}) {
    this.localQuota = {
      totalQuota: options.totalQuota || 1000,
      usedQuota: 0,
      availableQuota: options.totalQuota || 1000,
      resetTime: this.getNextResetTime(),
      provider: options.provider || 'local',
      capabilities: options.capabilities || ['text-generation'],
      rateLimits: {
        requestsPerMinute: options.requestsPerMinute || 60,
        requestsPerHour: options.requestsPerHour || 1000,
        maxConcurrent: options.maxConcurrent || 5
      }
    };
    
    this.peerQuotas = new Map(); // Map<peerId, QuotaStatus>
    this.requestHistory = []; // Array of request timestamps
    this.activeRequests = new Set(); // Set of active request IDs
    this.quotaEventHandlers = new Map();
    
    // Start quota monitoring
    this.startQuotaMonitoring();
  }

  /**
   * Get local quota status
   * @returns {object} - Current local quota status
   */
  getLocalQuota() {
    this.updateQuotaReset();
    return { ...this.localQuota };
  }

  /**
   * Update peer quota information
   * @param {string} peerId - Peer ID
   * @param {object} quotaStatus - Peer's quota status
   */
  updatePeerQuota(peerId, quotaStatus) {
    const existingQuota = this.peerQuotas.get(peerId);
    const updatedQuota = {
      ...quotaStatus,
      peerId,
      lastUpdated: Date.now(),
      reliability: this.calculateReliabilityScore(peerId, quotaStatus)
    };
    
    this.peerQuotas.set(peerId, updatedQuota);
    
    console.log(`[Quota] Updated quota for peer ${peerId}:`, updatedQuota);
    
    // Trigger quota update event
    this.triggerQuotaEvent('peer-quota-update', { peerId, quota: updatedQuota, previous: existingQuota });
  }

  /**
   * Check if local request can be made
   * @param {object} requestInfo - Request information
   * @returns {object} - Permission result
   */
  checkLocalPermission(requestInfo = {}) {
    this.updateQuotaReset();
    this.cleanupRequestHistory();
    
    const result = {
      allowed: true,
      reason: null,
      quotaRemaining: this.localQuota.availableQuota,
      rateLimitStatus: this.getRateLimitStatus(),
      recommendation: null
    };
    
    // Check quota availability
    if (this.localQuota.availableQuota <= 0) {
      result.allowed = false;
      result.reason = 'quota_exhausted';
      result.recommendation = 'delegate_to_peer';
      return result;
    }
    
    // Check rate limits
    const rateLimitCheck = this.checkRateLimits();
    if (!rateLimitCheck.allowed) {
      result.allowed = false;
      result.reason = rateLimitCheck.reason;
      result.recommendation = rateLimitCheck.severe ? 'delegate_to_peer' : 'retry_later';
      return result;
    }
    
    // Check concurrent request limit
    if (this.activeRequests.size >= this.localQuota.rateLimits.maxConcurrent) {
      result.allowed = false;
      result.reason = 'concurrent_limit_exceeded';
      result.recommendation = 'delegate_to_peer';
      return result;
    }
    
    // Check request priority and current load
    const currentLoad = this.calculateCurrentLoad();
    if (currentLoad > 0.8 && (!requestInfo.priority || requestInfo.priority < 5)) {
      result.allowed = false;
      result.reason = 'high_load_low_priority';
      result.recommendation = 'delegate_to_peer';
      return result;
    }
    
    return result;
  }

  /**
   * Reserve quota for a request
   * @param {object} requestInfo - Request information
   * @returns {string} - Reservation ID
   */
  reserveQuota(requestInfo = {}) {
    const permission = this.checkLocalPermission(requestInfo);
    if (!permission.allowed) {
      throw new Error(`Quota reservation denied: ${permission.reason}`);
    }
    
    const reservationId = this.generateReservationId();
    const cost = requestInfo.estimatedCost || 1;
    
    // Update quota
    this.localQuota.usedQuota += cost;
    this.localQuota.availableQuota -= cost;
    
    // Track active request
    this.activeRequests.add(reservationId);
    this.requestHistory.push({
      id: reservationId,
      timestamp: Date.now(),
      cost,
      status: 'active',
      ...requestInfo
    });
    
    console.log(`[Quota] Reserved quota for request ${reservationId}, cost: ${cost}, remaining: ${this.localQuota.availableQuota}`);
    
    // Trigger quota change event
    this.triggerQuotaEvent('quota-reserved', { reservationId, cost, remaining: this.localQuota.availableQuota });
    
    return reservationId;
  }

  /**
   * Release quota reservation
   * @param {string} reservationId - Reservation ID
   * @param {object} completionInfo - Completion information
   */
  releaseQuota(reservationId, completionInfo = {}) {
    const request = this.requestHistory.find(r => r.id === reservationId);
    if (!request) {
      console.warn(`[Quota] Reservation ${reservationId} not found`);
      return;
    }
    
    // Update request status
    request.status = completionInfo.status || 'completed';
    request.completedAt = Date.now();
    request.actualCost = completionInfo.actualCost || request.cost;
    
    // Remove from active requests
    this.activeRequests.delete(reservationId);
    
    // Adjust quota if actual cost differs from estimated
    if (completionInfo.actualCost && completionInfo.actualCost !== request.cost) {
      const adjustment = completionInfo.actualCost - request.cost;
      this.localQuota.usedQuota += adjustment;
      this.localQuota.availableQuota -= adjustment;
    }
    
    console.log(`[Quota] Released quota for request ${reservationId}, status: ${request.status}`);
    
    // Trigger quota change event
    this.triggerQuotaEvent('quota-released', { 
      reservationId, 
      status: request.status, 
      remaining: this.localQuota.availableQuota 
    });
  }

  /**
   * Find best peer for task delegation
   * @param {object} requirements - Task requirements
   * @returns {object|null} - Best peer or null if none suitable
   */
  findBestPeerForDelegation(requirements = {}) {
    const suitablePeers = [];
    
    for (const [peerId, quota] of this.peerQuotas.entries()) {
      if (this.isPeerSuitable(quota, requirements)) {
        suitablePeers.push({
          peerId,
          quota,
          score: this.calculateDelegationScore(quota, requirements)
        });
      }
    }
    
    if (suitablePeers.length === 0) {
      return null;
    }
    
    // Sort by score (highest first)
    suitablePeers.sort((a, b) => b.score - a.score);
    
    const bestPeer = suitablePeers[0];
    console.log(`[Quota] Best peer for delegation: ${bestPeer.peerId} (score: ${bestPeer.score})`);
    
    return bestPeer;
  }

  /**
   * Check if peer is suitable for delegation
   * @param {object} peerQuota - Peer quota status
   * @param {object} requirements - Task requirements
   * @returns {boolean} - Whether peer is suitable
   */
  isPeerSuitable(peerQuota, requirements) {
    // Check quota availability
    if (peerQuota.availableQuota <= 0) {
      return false;
    }
    
    // Check minimum quota requirement
    if (requirements.minQuota && peerQuota.availableQuota < requirements.minQuota) {
      return false;
    }
    
    // Check capability requirements
    if (requirements.capabilities) {
      const hasRequiredCapabilities = requirements.capabilities.every(cap => 
        peerQuota.capabilities && peerQuota.capabilities.includes(cap)
      );
      if (!hasRequiredCapabilities) {
        return false;
      }
    }
    
    // Check reliability threshold
    if (peerQuota.reliability < 0.7) {
      return false;
    }
    
    // Check last update freshness (not older than 5 minutes)
    const updateAge = Date.now() - peerQuota.lastUpdated;
    if (updateAge > 5 * 60 * 1000) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate delegation score for peer
   * @param {object} peerQuota - Peer quota status
   * @param {object} requirements - Task requirements
   * @returns {number} - Delegation score
   */
  calculateDelegationScore(peerQuota, requirements) {
    let score = 0;
    
    // Quota availability (40% weight)
    score += (peerQuota.availableQuota / peerQuota.totalQuota) * 40;
    
    // Reliability (30% weight)
    score += peerQuota.reliability * 30;
    
    // Performance metrics (20% weight)
    if (peerQuota.performance) {
      const latencyScore = Math.max(0, 20 - (peerQuota.performance.latency || 100) / 10);
      score += latencyScore;
    }
    
    // Capability match (10% weight)
    if (requirements.capabilities && peerQuota.capabilities) {
      const matchRatio = requirements.capabilities.filter(cap => 
        peerQuota.capabilities.includes(cap)
      ).length / requirements.capabilities.length;
      score += matchRatio * 10;
    }
    
    // Freshness bonus
    const updateAge = Date.now() - peerQuota.lastUpdated;
    if (updateAge < 60000) { // Less than 1 minute
      score += 5;
    }
    
    return Math.round(score * 100) / 100;
  }

  /**
   * Calculate reliability score for peer
   * @param {string} peerId - Peer ID
   * @param {object} quotaStatus - Current quota status
   * @returns {number} - Reliability score (0-1)
   */
  calculateReliabilityScore(peerId, quotaStatus) {
    // Simple reliability calculation based on consistent reporting
    // In a real implementation, this would consider success rates, uptime, etc.
    const existingQuota = this.peerQuotas.get(peerId);
    
    if (!existingQuota) {
      return 0.8; // Default for new peers
    }
    
    let reliability = existingQuota.reliability || 0.8;
    
    // Adjust based on quota consistency
    if (quotaStatus.totalQuota === existingQuota.totalQuota) {
      reliability = Math.min(1.0, reliability + 0.01);
    } else {
      reliability = Math.max(0.5, reliability - 0.05);
    }
    
    return Math.round(reliability * 100) / 100;
  }

  /**
   * Get rate limit status
   * @returns {object} - Rate limit status
   */
  getRateLimitStatus() {
    this.cleanupRequestHistory();
    const now = Date.now();
    
    // Count requests in last minute and hour
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const requestsLastMinute = this.requestHistory.filter(r => r.timestamp > oneMinuteAgo).length;
    const requestsLastHour = this.requestHistory.filter(r => r.timestamp > oneHourAgo).length;
    
    return {
      requestsPerMinute: {
        current: requestsLastMinute,
        limit: this.localQuota.rateLimits.requestsPerMinute,
        remaining: Math.max(0, this.localQuota.rateLimits.requestsPerMinute - requestsLastMinute)
      },
      requestsPerHour: {
        current: requestsLastHour,
        limit: this.localQuota.rateLimits.requestsPerHour,
        remaining: Math.max(0, this.localQuota.rateLimits.requestsPerHour - requestsLastHour)
      },
      concurrent: {
        current: this.activeRequests.size,
        limit: this.localQuota.rateLimits.maxConcurrent,
        remaining: Math.max(0, this.localQuota.rateLimits.maxConcurrent - this.activeRequests.size)
      }
    };
  }

  /**
   * Check rate limits
   * @returns {object} - Rate limit check result
   */
  checkRateLimits() {
    const status = this.getRateLimitStatus();
    
    if (status.requestsPerMinute.remaining <= 0) {
      return { allowed: false, reason: 'rate_limit_minute', severe: true };
    }
    
    if (status.requestsPerHour.remaining <= 0) {
      return { allowed: false, reason: 'rate_limit_hour', severe: true };
    }
    
    if (status.concurrent.remaining <= 0) {
      return { allowed: false, reason: 'concurrent_limit', severe: false };
    }
    
    // Soft limits (warnings)
    if (status.requestsPerMinute.remaining < 5) {
      return { allowed: true, warning: 'approaching_minute_limit' };
    }
    
    if (status.requestsPerHour.remaining < 50) {
      return { allowed: true, warning: 'approaching_hour_limit' };
    }
    
    return { allowed: true };
  }

  /**
   * Calculate current system load
   * @returns {number} - Load ratio (0-1)
   */
  calculateCurrentLoad() {
    const quotaUsageRatio = this.localQuota.usedQuota / this.localQuota.totalQuota;
    const concurrentRatio = this.activeRequests.size / this.localQuota.rateLimits.maxConcurrent;
    const rateLimitStatus = this.getRateLimitStatus();
    const minuteRatio = 1 - (rateLimitStatus.requestsPerMinute.remaining / rateLimitStatus.requestsPerMinute.limit);
    
    // Weighted average of different load factors
    const load = (quotaUsageRatio * 0.4) + (concurrentRatio * 0.3) + (minuteRatio * 0.3);
    
    return Math.min(1.0, load);
  }

  /**
   * Update quota reset time and available quota
   */
  updateQuotaReset() {
    const now = Date.now();
    
    if (now >= this.localQuota.resetTime) {
      // Reset quota
      this.localQuota.usedQuota = 0;
      this.localQuota.availableQuota = this.localQuota.totalQuota;
      this.localQuota.resetTime = this.getNextResetTime();
      
      console.log(`[Quota] Quota reset, available: ${this.localQuota.availableQuota}`);
      
      // Clear old request history
      this.requestHistory = this.requestHistory.filter(r => 
        now - r.timestamp < 24 * 60 * 60 * 1000 // Keep last 24 hours
      );
      
      // Trigger reset event
      this.triggerQuotaEvent('quota-reset', { availableQuota: this.localQuota.availableQuota });
    }
  }

  /**
   * Get next quota reset time (daily reset at midnight UTC)
   * @returns {number} - Reset timestamp
   */
  getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Clean up old request history
   */
  cleanupRequestHistory() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoff);
  }

  /**
   * Start quota monitoring interval
   */
  startQuotaMonitoring() {
    // Check quota status every minute
    setInterval(() => {
      this.updateQuotaReset();
      this.cleanupRequestHistory();
      
      // Clean up stale peer quotas (older than 10 minutes)
      const staleThreshold = Date.now() - 10 * 60 * 1000;
      for (const [peerId, quota] of this.peerQuotas.entries()) {
        if (quota.lastUpdated < staleThreshold) {
          console.log(`[Quota] Removing stale quota for peer ${peerId}`);
          this.peerQuotas.delete(peerId);
          this.triggerQuotaEvent('peer-quota-removed', { peerId });
        }
      }
    }, 60000);
  }

  /**
   * Generate unique reservation ID
   * @returns {string} - Reservation ID
   */
  generateReservationId() {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {function} handler - Event handler
   */
  on(event, handler) {
    if (!this.quotaEventHandlers.has(event)) {
      this.quotaEventHandlers.set(event, []);
    }
    this.quotaEventHandlers.get(event).push(handler);
  }

  /**
   * Trigger quota event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  triggerQuotaEvent(event, data) {
    const handlers = this.quotaEventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[Quota] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get comprehensive quota summary
   * @returns {object} - Quota summary
   */
  getQuotaSummary() {
    this.updateQuotaReset();
    
    return {
      local: this.getLocalQuota(),
      rateLimits: this.getRateLimitStatus(),
      currentLoad: this.calculateCurrentLoad(),
      activeRequests: this.activeRequests.size,
      peers: Array.from(this.peerQuotas.entries()).map(([peerId, quota]) => ({
        peerId,
        ...quota
      })),
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Get quota-based recommendations
   * @returns {array} - Array of recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const load = this.calculateCurrentLoad();
    const rateLimits = this.getRateLimitStatus();
    
    if (load > 0.8) {
      recommendations.push({
        type: 'high_load',
        message: 'System load is high, consider delegating tasks to peers',
        severity: 'warning'
      });
    }
    
    if (this.localQuota.availableQuota < this.localQuota.totalQuota * 0.1) {
      recommendations.push({
        type: 'low_quota',
        message: 'Local quota is running low, delegation recommended',
        severity: 'warning'
      });
    }
    
    if (rateLimits.requestsPerMinute.remaining < 5) {
      recommendations.push({
        type: 'rate_limit_warning',
        message: 'Approaching rate limit, slow down requests',
        severity: 'caution'
      });
    }
    
    const suitablePeers = Array.from(this.peerQuotas.values()).filter(quota => 
      this.isPeerSuitable(quota, {})
    );
    
    if (suitablePeers.length === 0 && load > 0.6) {
      recommendations.push({
        type: 'no_peers_available',
        message: 'No suitable peers available for delegation',
        severity: 'info'
      });
    }
    
    return recommendations;
  }

  /**
   * Remove peer quota information
   * @param {string} peerId - Peer ID to remove
   */
  removePeerQuota(peerId) {
    if (this.peerQuotas.has(peerId)) {
      this.peerQuotas.delete(peerId);
      console.log(`[Quota] Removed quota information for peer ${peerId}`);
      this.triggerQuotaEvent('peer-quota-removed', { peerId });
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuotaMonitor;
}

// Global assignment for script tag usage
if (typeof window !== 'undefined') {
  window.QuotaMonitor = QuotaMonitor;
}