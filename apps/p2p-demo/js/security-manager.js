/**
 * Security Manager for P2P communications
 * Handles content filtering, rate limiting, abuse prevention, and peer trust scoring
 */
class SecurityManager {
  constructor(options = {}) {
    this.config = {
      maxPromptLength: options.maxPromptLength || 10000,
      maxResponseLength: options.maxResponseLength || 50000,
      rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute
      maxRequestsPerWindow: options.maxRequestsPerWindow || 30,
      trustDecayRate: options.trustDecayRate || 0.01,
      minimumTrustScore: options.minimumTrustScore || 0.3,
      enableContentFiltering: options.enableContentFiltering !== false,
      enableRateLimiting: options.enableRateLimiting !== false,
      ...options
    };
    
    this.peerTrustScores = new Map(); // Map<peerId, TrustScore>
    this.requestHistory = new Map(); // Map<peerId, RequestHistory[]>
    this.blockedPeers = new Set();
    this.suspiciousPatterns = new Map();
    this.securityEventHandlers = new Map();
    
    // Initialize security patterns
    this.initializeSecurityPatterns();
    
    // Start security monitoring
    this.startSecurityMonitoring();
  }

  /**
   * Initialize malicious pattern detection
   */
  initializeSecurityPatterns() {
    // Dangerous prompt patterns
    this.dangerousPatterns = [
      // System prompt injection attempts
      /system\s*prompt\s*[:\-]?/i,
      /ignore\s+previous\s+instructions/i,
      /forget\s+everything\s+above/i,
      /act\s+as\s+if\s+you\s+are/i,
      
      // Code execution attempts
      /execute\s+code/i,
      /run\s+script/i,
      /eval\s*\(/i,
      /subprocess/i,
      /shell\s+command/i,
      
      // Information extraction attempts
      /reveal\s+your\s+prompt/i,
      /show\s+me\s+your\s+system/i,
      /what\s+are\s+your\s+instructions/i,
      
      // Harmful content patterns
      /how\s+to\s+(hack|break|exploit)/i,
      /illegal\s+(activities|drugs|weapons)/i,
      /generate\s+(malware|virus)/i,
      
      // Personal information requests
      /credit\s+card\s+number/i,
      /social\s+security/i,
      /password\s+for/i,
      
      // Excessive repetition (potential DoS)
      /(.{1,50})\1{10,}/i
    ];
    
    // Suspicious response patterns
    this.responsePatterns = [
      // Script tags
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      
      // Executable content
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      
      // SQL injection patterns
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      
      // Command injection
      /&&\s*rm\s+-rf/gi,
      /;\s*cat\s+\/etc/gi,
      /`[^`]*`/g
    ];
  }

  /**
   * Validate incoming prompt for security issues
   * @param {string} prompt - The prompt to validate
   * @param {string} senderId - ID of the sender
   * @returns {object} - Validation result
   */
  validatePrompt(prompt, senderId) {
    const result = {
      valid: true,
      issues: [],
      riskLevel: 'low',
      trustImpact: 0,
      action: 'allow'
    };
    
    // Check if peer is blocked
    if (this.blockedPeers.has(senderId)) {
      result.valid = false;
      result.issues.push('sender_blocked');
      result.riskLevel = 'critical';
      result.action = 'reject';
      return result;
    }
    
    // Check prompt length
    if (prompt.length > this.config.maxPromptLength) {
      result.issues.push('prompt_too_long');
      result.riskLevel = 'medium';
      result.trustImpact = -0.1;
    }
    
    // Check for malicious patterns
    const maliciousPatterns = this.detectMaliciousPatterns(prompt);
    if (maliciousPatterns.length > 0) {
      result.issues.push(...maliciousPatterns);
      result.riskLevel = 'high';
      result.trustImpact = -0.3;
      
      // Critical patterns should be rejected
      const criticalPatterns = ['system_prompt_injection', 'code_execution', 'information_extraction'];
      if (maliciousPatterns.some(pattern => criticalPatterns.includes(pattern))) {
        result.valid = false;
        result.riskLevel = 'critical';
        result.action = 'reject';
        result.trustImpact = -0.5;
      }
    }
    
    // Check rate limiting
    if (this.config.enableRateLimiting) {
      const rateLimitResult = this.checkRateLimit(senderId);
      if (!rateLimitResult.allowed) {
        result.valid = false;
        result.issues.push('rate_limit_exceeded');
        result.riskLevel = 'medium';
        result.action = 'reject';
        result.trustImpact = -0.2;
      }
    }
    
    // Check trust score
    const trustScore = this.getTrustScore(senderId);
    if (trustScore < this.config.minimumTrustScore) {
      result.valid = false;
      result.issues.push('low_trust_score');
      result.riskLevel = 'high';
      result.action = 'reject';
    }
    
    // Log security event
    this.logSecurityEvent('prompt_validation', {
      senderId,
      promptLength: prompt.length,
      issues: result.issues,
      riskLevel: result.riskLevel,
      trustScore: trustScore,
      action: result.action
    });
    
    // Update trust score
    if (result.trustImpact !== 0) {
      this.updateTrustScore(senderId, result.trustImpact);
    }
    
    return result;
  }

  /**
   * Sanitize response content before sending
   * @param {string} response - Response to sanitize
   * @returns {string} - Sanitized response
   */
  sanitizeResponse(response) {
    if (!this.config.enableContentFiltering) {
      return response;
    }
    
    let sanitized = response;
    
    // Remove potentially harmful patterns
    this.responsePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REMOVED_FOR_SECURITY]');
    });
    
    // Remove excessive whitespace and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Truncate if too long
    if (sanitized.length > this.config.maxResponseLength) {
      sanitized = sanitized.substring(0, this.config.maxResponseLength) + '...[TRUNCATED]';
    }
    
    return sanitized;
  }

  /**
   * Detect malicious patterns in prompt
   * @param {string} prompt - Prompt to analyze
   * @returns {array} - Array of detected pattern types
   */
  detectMaliciousPatterns(prompt) {
    const detectedPatterns = [];
    
    // Check each dangerous pattern
    this.dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(prompt)) {
        const patternType = this.getPatternType(index);
        detectedPatterns.push(patternType);
        
        // Track pattern occurrence
        this.trackSuspiciousPattern(patternType, prompt);
      }
    });
    
    // Check for unusual characteristics
    const wordCount = prompt.split(/\s+/).length;
    const avgWordLength = prompt.replace(/\s+/g, '').length / wordCount;
    const uppercaseRatio = (prompt.match(/[A-Z]/g) || []).length / prompt.length;
    const repetitiveChars = this.detectRepetitiveContent(prompt);
    
    if (avgWordLength > 15) {
      detectedPatterns.push('unusual_word_length');
    }
    
    if (uppercaseRatio > 0.8) {
      detectedPatterns.push('excessive_uppercase');
    }
    
    if (repetitiveChars > 0.3) {
      detectedPatterns.push('repetitive_content');
    }
    
    return detectedPatterns;
  }

  /**
   * Get pattern type based on pattern index
   * @param {number} index - Pattern index
   * @returns {string} - Pattern type
   */
  getPatternType(index) {
    const patternTypes = [
      'system_prompt_injection', 'system_prompt_injection', 'system_prompt_injection', 'system_prompt_injection',
      'code_execution', 'code_execution', 'code_execution', 'code_execution', 'code_execution',
      'information_extraction', 'information_extraction', 'information_extraction',
      'harmful_content', 'harmful_content', 'harmful_content',
      'personal_info_request', 'personal_info_request', 'personal_info_request',
      'repetitive_content'
    ];
    
    return patternTypes[index] || 'unknown_pattern';
  }

  /**
   * Detect repetitive content in text
   * @param {string} text - Text to analyze
   * @returns {number} - Repetition ratio (0-1)
   */
  detectRepetitiveContent(text) {
    const chunks = [];
    const chunkSize = 20;
    
    // Create overlapping chunks
    for (let i = 0; i <= text.length - chunkSize; i += 5) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    
    // Count duplicate chunks
    const chunkCounts = new Map();
    chunks.forEach(chunk => {
      chunkCounts.set(chunk, (chunkCounts.get(chunk) || 0) + 1);
    });
    
    // Calculate repetition ratio
    let repetitiveChunks = 0;
    chunkCounts.forEach(count => {
      if (count > 1) {
        repetitiveChunks += count - 1;
      }
    });
    
    return repetitiveChunks / chunks.length;
  }

  /**
   * Track suspicious pattern occurrence
   * @param {string} patternType - Type of pattern
   * @param {string} content - Content that matched
   */
  trackSuspiciousPattern(patternType, content) {
    if (!this.suspiciousPatterns.has(patternType)) {
      this.suspiciousPatterns.set(patternType, {
        count: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        samples: []
      });
    }
    
    const pattern = this.suspiciousPatterns.get(patternType);
    pattern.count++;
    pattern.lastSeen = Date.now();
    
    // Keep a few samples for analysis
    if (pattern.samples.length < 5) {
      pattern.samples.push({
        content: content.substring(0, 200),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Check rate limit for peer
   * @param {string} peerId - Peer ID
   * @returns {object} - Rate limit result
   */
  checkRateLimit(peerId) {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    // Get or create request history for peer
    if (!this.requestHistory.has(peerId)) {
      this.requestHistory.set(peerId, []);
    }
    
    const history = this.requestHistory.get(peerId);
    
    // Remove old requests outside the window
    while (history.length > 0 && history[0].timestamp < windowStart) {
      history.shift();
    }
    
    // Check if limit exceeded
    if (history.length >= this.config.maxRequestsPerWindow) {
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        requestCount: history.length,
        windowStart: windowStart,
        resetTime: history[0].timestamp + this.config.rateLimitWindow
      };
    }
    
    // Add current request
    history.push({
      timestamp: now,
      type: 'prompt'
    });
    
    return {
      allowed: true,
      requestCount: history.length,
      remaining: this.config.maxRequestsPerWindow - history.length
    };
  }

  /**
   * Get trust score for peer
   * @param {string} peerId - Peer ID
   * @returns {number} - Trust score (0-1)
   */
  getTrustScore(peerId) {
    if (!this.peerTrustScores.has(peerId)) {
      // New peers start with neutral trust
      this.peerTrustScores.set(peerId, {
        score: 0.7,
        lastUpdated: Date.now(),
        interactions: 0,
        violations: 0,
        positiveActions: 0
      });
    }
    
    const trustData = this.peerTrustScores.get(peerId);
    
    // Apply trust decay over time
    const timeSinceUpdate = Date.now() - trustData.lastUpdated;
    const decayFactor = Math.exp(-this.config.trustDecayRate * timeSinceUpdate / (24 * 60 * 60 * 1000));
    
    return Math.max(0, Math.min(1, trustData.score * decayFactor));
  }

  /**
   * Update trust score for peer
   * @param {string} peerId - Peer ID
   * @param {number} delta - Trust score change
   * @param {string} reason - Reason for change
   */
  updateTrustScore(peerId, delta, reason = '') {
    if (!this.peerTrustScores.has(peerId)) {
      this.peerTrustScores.set(peerId, {
        score: 0.7,
        lastUpdated: Date.now(),
        interactions: 0,
        violations: 0,
        positiveActions: 0
      });
    }
    
    const trustData = this.peerTrustScores.get(peerId);
    const oldScore = trustData.score;
    
    // Update score with bounds checking
    trustData.score = Math.max(0, Math.min(1, trustData.score + delta));
    trustData.lastUpdated = Date.now();
    trustData.interactions++;
    
    if (delta < 0) {
      trustData.violations++;
    } else if (delta > 0) {
      trustData.positiveActions++;
    }
    
    console.log(`[Security] Trust score for ${peerId}: ${oldScore.toFixed(3)} -> ${trustData.score.toFixed(3)} (${reason})`);
    
    // Check if peer should be blocked
    if (trustData.score < this.config.minimumTrustScore && trustData.violations > 3) {
      this.blockPeer(peerId, 'low_trust_score');
    }
    
    // Trigger trust update event
    this.triggerSecurityEvent('trust-score-updated', {
      peerId,
      oldScore,
      newScore: trustData.score,
      delta,
      reason,
      trustData
    });
  }

  /**
   * Block peer from future interactions
   * @param {string} peerId - Peer ID to block
   * @param {string} reason - Reason for blocking
   */
  blockPeer(peerId, reason) {
    this.blockedPeers.add(peerId);
    
    console.log(`[Security] Blocked peer ${peerId} for reason: ${reason}`);
    
    this.logSecurityEvent('peer_blocked', {
      peerId,
      reason,
      trustScore: this.getTrustScore(peerId),
      timestamp: Date.now()
    });
    
    this.triggerSecurityEvent('peer-blocked', { peerId, reason });
  }

  /**
   * Unblock peer
   * @param {string} peerId - Peer ID to unblock
   */
  unblockPeer(peerId) {
    if (this.blockedPeers.delete(peerId)) {
      console.log(`[Security] Unblocked peer ${peerId}`);
      this.triggerSecurityEvent('peer-unblocked', { peerId });
    }
  }

  /**
   * Check if peer is blocked
   * @param {string} peerId - Peer ID
   * @returns {boolean} - Whether peer is blocked
   */
  isPeerBlocked(peerId) {
    return this.blockedPeers.has(peerId);
  }

  /**
   * Report successful interaction with peer
   * @param {string} peerId - Peer ID
   * @param {object} interactionData - Interaction details
   */
  reportSuccessfulInteraction(peerId, interactionData = {}) {
    this.updateTrustScore(peerId, 0.05, 'successful_interaction');
    
    this.logSecurityEvent('successful_interaction', {
      peerId,
      ...interactionData,
      timestamp: Date.now()
    });
  }

  /**
   * Report failed interaction with peer
   * @param {string} peerId - Peer ID
   * @param {string} reason - Failure reason
   * @param {object} interactionData - Interaction details
   */
  reportFailedInteraction(peerId, reason, interactionData = {}) {
    let trustPenalty = -0.1;
    
    // Adjust penalty based on failure type
    switch (reason) {
      case 'timeout':
        trustPenalty = -0.05;
        break;
      case 'malicious_content':
        trustPenalty = -0.3;
        break;
      case 'connection_failed':
        trustPenalty = -0.02;
        break;
    }
    
    this.updateTrustScore(peerId, trustPenalty, `failed_interaction: ${reason}`);
    
    this.logSecurityEvent('failed_interaction', {
      peerId,
      reason,
      trustPenalty,
      ...interactionData,
      timestamp: Date.now()
    });
  }

  /**
   * Get security summary for peer
   * @param {string} peerId - Peer ID
   * @returns {object} - Security summary
   */
  getPeerSecuritySummary(peerId) {
    const trustData = this.peerTrustScores.get(peerId);
    const requestHist = this.requestHistory.get(peerId) || [];
    
    return {
      peerId,
      trustScore: this.getTrustScore(peerId),
      isBlocked: this.isPeerBlocked(peerId),
      interactions: trustData ? trustData.interactions : 0,
      violations: trustData ? trustData.violations : 0,
      positiveActions: trustData ? trustData.positiveActions : 0,
      recentRequests: requestHist.length,
      lastInteraction: trustData ? trustData.lastUpdated : null,
      riskLevel: this.calculateRiskLevel(peerId)
    };
  }

  /**
   * Calculate risk level for peer
   * @param {string} peerId - Peer ID
   * @returns {string} - Risk level
   */
  calculateRiskLevel(peerId) {
    const trustScore = this.getTrustScore(peerId);
    const trustData = this.peerTrustScores.get(peerId);
    
    if (this.isPeerBlocked(peerId)) {
      return 'blocked';
    }
    
    if (trustScore < 0.3) {
      return 'high';
    }
    
    if (trustScore < 0.5) {
      return 'medium';
    }
    
    if (trustData && trustData.violations > trustData.positiveActions) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    // Clean up old data every 10 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 10 * 60 * 1000);
    
    // Generate security report every hour
    setInterval(() => {
      this.generateSecurityReport();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old security data
   */
  cleanupOldData() {
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up request history
    for (const [peerId, history] of this.requestHistory.entries()) {
      const filteredHistory = history.filter(req => now - req.timestamp < cleanupThreshold);
      if (filteredHistory.length === 0) {
        this.requestHistory.delete(peerId);
      } else {
        this.requestHistory.set(peerId, filteredHistory);
      }
    }
    
    // Clean up trust scores for peers not seen recently
    for (const [peerId, trustData] of this.peerTrustScores.entries()) {
      if (now - trustData.lastUpdated > 7 * 24 * 60 * 60 * 1000) { // 7 days
        this.peerTrustScores.delete(peerId);
        console.log(`[Security] Cleaned up trust data for inactive peer ${peerId}`);
      }
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: Date.now(),
      totalPeers: this.peerTrustScores.size,
      blockedPeers: this.blockedPeers.size,
      suspiciousPatterns: Array.from(this.suspiciousPatterns.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen
      })),
      trustScoreDistribution: this.getTrustScoreDistribution(),
      riskLevels: this.getRiskLevelDistribution()
    };
    
    console.log('[Security] Security Report:', report);
    this.triggerSecurityEvent('security-report', report);
  }

  /**
   * Get trust score distribution
   * @returns {object} - Distribution of trust scores
   */
  getTrustScoreDistribution() {
    const distribution = { high: 0, medium: 0, low: 0, blocked: 0 };
    
    for (const peerId of this.peerTrustScores.keys()) {
      const score = this.getTrustScore(peerId);
      if (this.isPeerBlocked(peerId)) {
        distribution.blocked++;
      } else if (score >= 0.7) {
        distribution.high++;
      } else if (score >= 0.5) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    }
    
    return distribution;
  }

  /**
   * Get risk level distribution
   * @returns {object} - Distribution of risk levels
   */
  getRiskLevelDistribution() {
    const distribution = { low: 0, medium: 0, high: 0, blocked: 0 };
    
    for (const peerId of this.peerTrustScores.keys()) {
      const riskLevel = this.calculateRiskLevel(peerId);
      distribution[riskLevel]++;
    }
    
    return distribution;
  }

  /**
   * Log security event
   * @param {string} eventType - Type of security event
   * @param {object} eventData - Event data
   */
  logSecurityEvent(eventType, eventData) {
    const logEntry = {
      type: eventType,
      timestamp: Date.now(),
      ...eventData
    };
    
    console.log(`[Security] ${eventType}:`, logEntry);
    
    // In a real implementation, this would be sent to a security monitoring system
    this.triggerSecurityEvent('security-log', logEntry);
  }

  /**
   * Register security event handler
   * @param {string} event - Event name
   * @param {function} handler - Event handler
   */
  on(event, handler) {
    if (!this.securityEventHandlers.has(event)) {
      this.securityEventHandlers.set(event, []);
    }
    this.securityEventHandlers.get(event).push(handler);
  }

  /**
   * Trigger security event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  triggerSecurityEvent(event, data) {
    const handlers = this.securityEventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[Security] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get comprehensive security status
   * @returns {object} - Security status
   */
  getSecurityStatus() {
    return {
      configuration: this.config,
      blockedPeers: Array.from(this.blockedPeers),
      trustScoreDistribution: this.getTrustScoreDistribution(),
      riskLevelDistribution: this.getRiskLevelDistribution(),
      suspiciousPatterns: Array.from(this.suspiciousPatterns.entries()),
      recentActivity: {
        totalRequests: Array.from(this.requestHistory.values()).reduce((sum, hist) => sum + hist.length, 0),
        activePeers: this.requestHistory.size
      }
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityManager;
}

// Global assignment for script tag usage
if (typeof window !== 'undefined') {
  window.SecurityManager = SecurityManager;
}