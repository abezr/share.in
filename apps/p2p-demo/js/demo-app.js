/**
 * P2P Task Handoff Demo Application
 * Main application logic integrating all components
 */
class P2PDemo {
  constructor() {
    this.p2pManager = new EnhancedP2PManager();
    this.quotaMonitor = new QuotaMonitor({
      totalQuota: 1000,
      requestsPerMinute: 60,
      maxConcurrent: 5
    });
    this.securityManager = new SecurityManager();
    
    this.currentExecutionId = null;
    this.discoveredPeers = new Map();
    this.activeTasks = new Map();
    
    this.initializeUI();
    this.setupEventHandlers();
    this.startUIUpdates();
  }

  initializeUI() {
    // Get DOM elements
    this.elements = {
      // Status bar
      statusBar: document.getElementById('statusBar'),
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      peerCount: document.getElementById('peerCount'),
      quotaStatus: document.getElementById('quotaStatus'),
      
      // Connection
      signalingUrl: document.getElementById('signalingUrl'),
      connectBtn: document.getElementById('connectBtn'),
      disconnectBtn: document.getElementById('disconnectBtn'),
      peerIdDisplay: document.getElementById('peerIdDisplay'),
      connectionState: document.getElementById('connectionState'),
      
      // Capabilities
      hasAI: document.getElementById('hasAI'),
      hasGPU: document.getElementById('hasGPU'),
      hasStorage: document.getElementById('hasStorage'),
      quotaTotal: document.getElementById('quotaTotal'),
      quotaUsed: document.getElementById('quotaUsed'),
      announceCapabilitiesBtn: document.getElementById('announceCapabilitiesBtn'),
      
      // Peers
      discoverPeersBtn: document.getElementById('discoverPeersBtn'),
      refreshPeersBtn: document.getElementById('refreshPeersBtn'),
      peerGrid: document.getElementById('peerGrid'),
      noPeersMessage: document.getElementById('noPeersMessage'),
      
      // Task delegation
      promptInput: document.getElementById('promptInput'),
      executionMode: document.getElementById('executionMode'),
      executePromptBtn: document.getElementById('executePromptBtn'),
      executionStatus: document.getElementById('executionStatus'),
      executionMessage: document.getElementById('executionMessage'),
      progressBar: document.getElementById('progressBar'),
      progressFill: document.getElementById('progressFill'),
      
      // Response
      responsePanel: document.getElementById('responsePanel'),
      responseSource: document.getElementById('responseSource'),
      responseTime: document.getElementById('responseTime'),
      responseContent: document.getElementById('responseContent'),
      clearResponseBtn: document.getElementById('clearResponseBtn'),
      copyResponseBtn: document.getElementById('copyResponseBtn'),
      
      // Monitoring
      localQuotaFill: document.getElementById('localQuotaFill'),
      localQuotaText: document.getElementById('localQuotaText'),
      requestsPerMinute: document.getElementById('requestsPerMinute'),
      concurrentRequests: document.getElementById('concurrentRequests'),
      blockedPeersCount: document.getElementById('blockedPeersCount'),
      securityEventsCount: document.getElementById('securityEventsCount'),
      trustScores: document.getElementById('trustScores'),
      connectionLatency: document.getElementById('connectionLatency'),
      successRate: document.getElementById('successRate'),
      activeConnections: document.getElementById('activeConnections'),
      
      // Logs
      logsContainer: document.getElementById('logsContainer'),
      clearLogsBtn: document.getElementById('clearLogsBtn'),
      autoScrollLogs: document.getElementById('autoScrollLogs')
    };
    
    this.updateConnectionState('disconnected');
    this.log('System initialized', 'info');
  }

  setupEventHandlers() {
    // Connection handlers
    this.elements.connectBtn.addEventListener('click', () => this.connect());
    this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());
    
    // Capabilities handlers
    this.elements.announceCapabilitiesBtn.addEventListener('click', () => this.announceCapabilities());
    this.elements.quotaTotal.addEventListener('change', () => this.updateLocalQuota());
    
    // Discovery handlers
    this.elements.discoverPeersBtn.addEventListener('click', () => this.discoverPeers());
    this.elements.refreshPeersBtn.addEventListener('click', () => this.discoverPeers());
    
    // Task delegation handlers
    this.elements.executePromptBtn.addEventListener('click', () => this.executePrompt());
    this.elements.promptInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.executePrompt();
      }
    });
    
    // Response handlers
    this.elements.clearResponseBtn.addEventListener('click', () => this.clearResponse());
    this.elements.copyResponseBtn.addEventListener('click', () => this.copyResponse());
    
    // Monitoring tab handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Logs handlers
    this.elements.clearLogsBtn.addEventListener('click', () => this.clearLogs());
    
    // P2P Manager events
    this.p2pManager.on('connection-state-change', (data) => {
      this.updateConnectionState(data.newState);
    });
    
    this.p2pManager.on('peers-discovered', (peers) => {
      this.updatePeerGrid(peers);
    });
    
    this.p2pManager.on('peer-capability-update', (data) => {
      this.updatePeerCapabilities(data.peerId, data.capabilities);
    });
    
    this.p2pManager.on('response-chunk', (data) => {
      this.handleResponseChunk(data);
    });
    
    // Quota Monitor events
    this.quotaMonitor.on('quota-reserved', (data) => {
      this.log(`Quota reserved: ${data.cost}, remaining: ${data.remaining}`, 'info');
    });
    
    this.quotaMonitor.on('quota-released', (data) => {
      this.log(`Quota released: ${data.reservationId}, status: ${data.status}`, 'info');
    });
    
    // Security Manager events
    this.securityManager.on('peer-blocked', (data) => {
      this.log(`Peer blocked: ${data.peerId} (${data.reason})`, 'warning');
    });
    
    this.securityManager.on('trust-score-updated', (data) => {
      this.log(`Trust score updated for ${data.peerId}: ${data.newScore.toFixed(2)}`, 'info');
    });
  }

  async connect() {
    try {
      this.elements.connectBtn.disabled = true;
      this.log('Connecting to signaling server...', 'info');
      
      await this.p2pManager.connect(this.elements.signalingUrl.value);
      
      this.elements.connectBtn.disabled = true;
      this.elements.disconnectBtn.disabled = false;
      this.elements.announceCapabilitiesBtn.disabled = false;
      this.elements.discoverPeersBtn.disabled = false;
      this.elements.refreshPeersBtn.disabled = false;
      this.elements.executePromptBtn.disabled = false;
      
      this.elements.peerIdDisplay.textContent = this.p2pManager.peerId || 'Not assigned';
      
      this.log('Connected to signaling server', 'success');
      
      // Auto-announce capabilities
      setTimeout(() => this.announceCapabilities(), 1000);
      
    } catch (error) {
      this.log(`Connection failed: ${error.message}`, 'error');
      this.elements.connectBtn.disabled = false;
    }
  }

  disconnect() {
    this.p2pManager.disconnect();
    
    this.elements.connectBtn.disabled = false;
    this.elements.disconnectBtn.disabled = true;
    this.elements.announceCapabilitiesBtn.disabled = true;
    this.elements.discoverPeersBtn.disabled = true;
    this.elements.refreshPeersBtn.disabled = true;
    this.elements.executePromptBtn.disabled = true;
    
    this.elements.peerIdDisplay.textContent = 'Not assigned';
    this.discoveredPeers.clear();
    this.updatePeerGrid([]);
    
    this.log('Disconnected from signaling server', 'info');
  }

  announceCapabilities() {
    const capabilities = {
      hasAI: this.elements.hasAI.checked,
      hasGPU: this.elements.hasGPU.checked,
      hasStorage: this.elements.hasStorage.checked,
      models: this.elements.hasAI.checked ? ['gpt-3.5-turbo', 'text-davinci-003'] : [],
      quota: this.quotaMonitor.getLocalQuota(),
      performance: {
        latency: 50 + Math.random() * 100,
        throughput: 1000 + Math.random() * 500
      }
    };
    
    this.p2pManager.announceCapabilities(capabilities);
    this.log('Capabilities announced', 'success');
  }

  async discoverPeers() {
    try {
      this.log('Discovering peers...', 'info');
      await this.p2pManager.discoverPeers({
        needsAI: true,
        minQuota: 10
      });
    } catch (error) {
      this.log(`Peer discovery failed: ${error.message}`, 'error');
    }
  }

  async executePrompt() {
    const prompt = this.elements.promptInput.value.trim();
    if (!prompt) {
      this.log('Please enter a prompt', 'warning');
      return;
    }
    
    // Security validation
    const validation = this.securityManager.validatePrompt(prompt, 'local');
    if (!validation.valid) {
      this.log(`Prompt rejected: ${validation.issues.join(', ')}`, 'error');
      return;
    }
    
    this.showExecutionStatus();
    const startTime = Date.now();
    
    try {
      let result;
      const mode = this.elements.executionMode.value;
      
      if (mode === 'local' || (mode === 'auto' && this.shouldExecuteLocally())) {
        result = await this.executeLocally(prompt);
      } else {
        result = await this.delegateToOptimalPeer(prompt);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.showResponse(result, duration, mode === 'local' ? 'Local' : 'Peer');
      this.log(`Prompt executed successfully in ${duration}ms`, 'success');
      
    } catch (error) {
      this.log(`Prompt execution failed: ${error.message}`, 'error');
    } finally {
      this.hideExecutionStatus();
    }
  }

  shouldExecuteLocally() {
    const permission = this.quotaMonitor.checkLocalPermission();
    return permission.allowed && this.discoveredPeers.size === 0;
  }

  async executeLocally(prompt) {
    this.setExecutionMessage('Processing locally...');
    this.setProgress(25);
    
    const reservationId = this.quotaMonitor.reserveQuota({
      estimatedCost: 10,
      priority: 5
    });
    
    try {
      // Simulate local processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.setProgress(75);
      
      const response = `Local AI Response: Based on your query "${prompt.substring(0, 50)}...", here are some insights from local processing.`;
      
      this.quotaMonitor.releaseQuota(reservationId, { status: 'completed', actualCost: 8 });
      this.setProgress(100);
      
      return response;
      
    } catch (error) {
      this.quotaMonitor.releaseQuota(reservationId, { status: 'failed' });
      throw error;
    }
  }

  async delegateToOptimalPeer(prompt) {
    const bestPeer = this.quotaMonitor.findBestPeerForDelegation();
    if (!bestPeer) {
      throw new Error('No suitable peers available for delegation');
    }
    
    this.setExecutionMessage(`Delegating to peer ${bestPeer.peerId}...`);
    this.setProgress(10);
    
    try {
      // Connect to peer if not already connected
      if (!this.p2pManager.connections.has(bestPeer.peerId)) {
        await this.p2pManager.connectToPeer(bestPeer.peerId);
        this.setProgress(30);
      }
      
      this.setExecutionMessage('Sending prompt...');
      this.setProgress(50);
      
      const response = await this.p2pManager.delegatePrompt(prompt, bestPeer.peerId);
      this.setProgress(100);
      
      // Update security score for successful interaction
      this.securityManager.reportSuccessfulInteraction(bestPeer.peerId);
      
      return response;
      
    } catch (error) {
      this.securityManager.reportFailedInteraction(bestPeer.peerId, 'delegation_failed');
      throw error;
    }
  }

  updateConnectionState(state) {
    this.elements.connectionState.textContent = state;
    this.elements.statusText.textContent = this.getStatusText(state);
    
    // Update status bar class
    this.elements.statusBar.className = `status-bar ${state}`;
    
    this.log(`Connection state: ${state}`, 'info');
  }

  getStatusText(state) {
    const stateTexts = {
      'disconnected': 'Disconnected',
      'signaling': 'Connecting...',
      'connected': 'Connected',
      'discovering': 'Discovering peers...',
      'connecting': 'Establishing P2P connection...',
      'p2p-connected': 'P2P Connected',
      'transferring': 'Transferring data...'
    };
    return stateTexts[state] || state;
  }

  updatePeerGrid(peers) {
    this.discoveredPeers.clear();
    peers.forEach(peer => this.discoveredPeers.set(peer.peerId, peer));
    
    if (peers.length === 0) {
      this.elements.peerGrid.innerHTML = '<div class=\"no-peers-message\"><p>No peers discovered yet.</p></div>';
      this.elements.noPeersMessage.style.display = 'block';
    } else {
      this.elements.noPeersMessage.style.display = 'none';
      this.renderPeerCards(peers);
    }
    
    this.elements.peerCount.textContent = peers.length;
    this.log(`Discovered ${peers.length} peers`, 'info');
  }

  renderPeerCards(peers) {
    this.elements.peerGrid.innerHTML = peers.map(peer => `
      <div class=\"peer-card\" data-peer-id=\"${peer.peerId}\">
        <div class=\"peer-header\">
          <span class=\"peer-id\">${peer.peerId.substring(0, 8)}...</span>
          <span class=\"peer-status available\">Available</span>
        </div>
        <div class=\"peer-capabilities\">
          <h4>Capabilities</h4>
          <div class=\"capability-tags\">
            ${peer.capabilities.hasAI ? '<span class=\"capability-tag\">AI</span>' : ''}
            ${peer.capabilities.hasGPU ? '<span class=\"capability-tag\">GPU</span>' : ''}
            ${peer.capabilities.models ? peer.capabilities.models.map(m => `<span class=\"capability-tag\">${m}</span>`).join('') : ''}
          </div>
        </div>
        <div class=\"peer-quota\">
          <div class=\"quota-item\">
            <label>Quota:</label>
            <div class=\"quota-bar\">
              <div class=\"quota-fill\" style=\"width: ${(peer.capabilities.quota.availableQuota / peer.capabilities.quota.totalQuota) * 100}%\"></div>
            </div>
            <span class=\"quota-text\">${peer.capabilities.quota.availableQuota} / ${peer.capabilities.quota.totalQuota}</span>
          </div>
        </div>
        <div class=\"peer-actions\">
          <button class=\"btn btn-primary\" onclick=\"app.connectToPeer('${peer.peerId}')\">Connect</button>
          <button class=\"btn btn-secondary\" onclick=\"app.delegatePromptToPeer('${peer.peerId}')\">Delegate</button>
        </div>
      </div>
    `).join('');
  }

  async connectToPeer(peerId) {
    try {
      this.log(`Connecting to peer ${peerId}...`, 'info');
      await this.p2pManager.connectToPeer(peerId);
      this.updatePeerCardStatus(peerId, 'connected');
    } catch (error) {
      this.log(`Failed to connect to peer ${peerId}: ${error.message}`, 'error');
    }
  }

  updatePeerCardStatus(peerId, status) {
    const card = document.querySelector(`[data-peer-id=\"${peerId}\"]`);
    if (card) {
      card.className = `peer-card ${status}`;
      const statusEl = card.querySelector('.peer-status');
      if (statusEl) {
        statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusEl.className = `peer-status ${status}`;
      }
    }
  }

  showExecutionStatus() {
    this.elements.executionStatus.style.display = 'block';
    this.elements.executePromptBtn.disabled = true;
  }

  hideExecutionStatus() {
    this.elements.executionStatus.style.display = 'none';
    this.elements.executePromptBtn.disabled = false;
    this.elements.progressFill.style.width = '0%';
  }

  setExecutionMessage(message) {
    this.elements.executionMessage.textContent = message;
  }

  setProgress(percentage) {
    this.elements.progressFill.style.width = `${percentage}%`;
  }

  showResponse(content, duration, source) {
    this.elements.responsePanel.style.display = 'block';
    this.elements.responseSource.textContent = `Source: ${source}`;
    this.elements.responseTime.textContent = `Duration: ${duration}ms`;
    this.elements.responseContent.textContent = content;
    
    // Scroll to response
    this.elements.responsePanel.scrollIntoView({ behavior: 'smooth' });
  }

  clearResponse() {
    this.elements.responsePanel.style.display = 'none';
    this.elements.responseContent.textContent = '';
  }

  async copyResponse() {
    try {
      await navigator.clipboard.writeText(this.elements.responseContent.textContent);
      this.log('Response copied to clipboard', 'success');
    } catch (error) {
      this.log('Failed to copy response', 'error');
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
  }

  startUIUpdates() {
    setInterval(() => {
      this.updateMonitoringPanels();
    }, 2000);
  }

  updateMonitoringPanels() {
    // Update quota monitoring
    const quotaSummary = this.quotaMonitor.getQuotaSummary();
    const usagePercentage = (quotaSummary.local.usedQuota / quotaSummary.local.totalQuota) * 100;
    
    this.elements.localQuotaFill.style.width = `${usagePercentage}%`;
    this.elements.localQuotaText.textContent = `${quotaSummary.local.usedQuota} / ${quotaSummary.local.totalQuota}`;
    this.elements.requestsPerMinute.textContent = `${quotaSummary.rateLimits.requestsPerMinute.current} / ${quotaSummary.rateLimits.requestsPerMinute.limit}`;
    this.elements.concurrentRequests.textContent = `${quotaSummary.rateLimits.concurrent.current} / ${quotaSummary.rateLimits.concurrent.limit}`;
    
    // Update quota status in status bar
    this.elements.quotaStatus.textContent = `Quota: ${quotaSummary.local.availableQuota}/${quotaSummary.local.totalQuota}`;
    
    // Update security monitoring
    const securityStatus = this.securityManager.getSecurityStatus();
    this.elements.blockedPeersCount.textContent = securityStatus.blockedPeers.length;
    
    // Update performance metrics
    const connectionInfo = this.p2pManager.getConnectionInfo();
    this.elements.activeConnections.textContent = connectionInfo.connectedPeers.length;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class=\"log-time\">[${timestamp}]</span><span class=\"log-message\">${message}</span>`;
    
    this.elements.logsContainer.appendChild(logEntry);
    
    // Auto-scroll if enabled
    if (this.elements.autoScrollLogs.checked) {
      logEntry.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Limit log entries
    const maxLogs = 100;
    while (this.elements.logsContainer.children.length > maxLogs) {
      this.elements.logsContainer.removeChild(this.elements.logsContainer.firstChild);
    }
  }

  clearLogs() {
    this.elements.logsContainer.innerHTML = '';
    this.log('Logs cleared', 'info');
  }
}

// Initialize application when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new P2PDemo();
  console.log('P2P Task Handoff Demo initialized');
});