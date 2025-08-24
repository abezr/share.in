/**
 * Enhanced P2P Manager for WebRTC-based peer-to-peer communication
 * Manages connection lifecycle, peer discovery, and data channel communication
 */
class EnhancedP2PManager {
  constructor() {
    this.peerId = null;
    this.ws = null;
    this.connections = new Map(); // Map<peerId, RTCPeerConnection>
    this.dataChannels = new Map(); // Map<peerId, RTCDataChannel>
    this.peers = new Map(); // Map<peerId, PeerInfo>
    this.connectionState = 'disconnected';
    this.messageHandlers = new Map();
    this.eventHandlers = new Map();
    
    // WebRTC configuration
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };
    
    this.setupMessageHandlers();
  }

  /**
   * Connect to signaling server
   * @param {string} signalingUrl - WebSocket URL for signaling server
   */
  async connect(signalingUrl = 'ws://localhost:8083/signaling') {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(signalingUrl);
        this.updateConnectionState('signaling');
        
        this.ws.onopen = () => {
          console.log('[P2P] Connected to signaling server');
          this.updateConnectionState('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleSignalingMessage(message);
          } catch (error) {
            console.error('[P2P] Failed to parse signaling message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('[P2P] Disconnected from signaling server');
          this.updateConnectionState('disconnected');
        };
        
        this.ws.onerror = (error) => {
          console.error('[P2P] WebSocket error:', error);
          this.updateConnectionState('disconnected');
          reject(error);
        };
        
        // Connection timeout
        setTimeout(() => {
          if (this.connectionState === 'signaling') {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Announce capabilities to other peers
   * @param {object} capabilities - Local capabilities
   */
  announceCapabilities(capabilities) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to signaling server');
    }
    
    this.sendSignalingMessage({
      type: 'capability-announce',
      capabilities
    });
    
    console.log('[P2P] Capabilities announced:', capabilities);
  }

  /**
   * Discover peers matching requirements
   * @param {object} requirements - Peer requirements
   */
  async discoverPeers(requirements = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to signaling server');
    }
    
    this.updateConnectionState('discovering');
    
    this.sendSignalingMessage({
      type: 'discover',
      requirements
    });
    
    console.log('[P2P] Discovering peers with requirements:', requirements);
  }

  /**
   * Initiate WebRTC connection with a peer
   * @param {string} targetPeerId - Target peer ID
   */
  async connectToPeer(targetPeerId) {
    if (this.connections.has(targetPeerId)) {
      console.log(`[P2P] Already connected to peer ${targetPeerId}`);
      return;
    }
    
    console.log(`[P2P] Initiating connection to peer ${targetPeerId}`);
    this.updateConnectionState('connecting');
    
    try {
      const pc = new RTCPeerConnection(this.rtcConfig);
      this.connections.set(targetPeerId, pc);
      this.setupPeerConnection(pc, targetPeerId);
      
      // Create data channel
      const dataChannel = pc.createDataChannel('p2p-tasks', {
        ordered: true,
        maxRetransmits: 3
      });
      this.setupDataChannel(dataChannel, targetPeerId);
      this.dataChannels.set(targetPeerId, dataChannel);
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        targetPeerId,
        sdp: offer
      });
      
    } catch (error) {
      console.error(`[P2P] Failed to connect to peer ${targetPeerId}:`, error);
      this.connections.delete(targetPeerId);
      this.dataChannels.delete(targetPeerId);
      throw error;
    }
  }

  /**
   * Delegate a prompt to a specific peer
   * @param {string} prompt - The prompt to delegate
   * @param {string} targetPeerId - Target peer ID
   * @param {object} options - Delegation options
   */
  async delegatePrompt(prompt, targetPeerId, options = {}) {
    const dataChannel = this.dataChannels.get(targetPeerId);
    
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error(`No active data channel to peer ${targetPeerId}`);
    }
    
    const taskId = this.generateTaskId();
    const message = {
      type: 'prompt-delegation',
      taskId,
      prompt,
      requesterCapabilities: options.capabilities || {},
      priority: options.priority || 1,
      timeout: options.timeout || 30000,
      timestamp: Date.now()
    };
    
    console.log(`[P2P] Delegating prompt to ${targetPeerId}:`, { taskId, prompt: prompt.substring(0, 50) + '...' });
    
    try {
      dataChannel.send(JSON.stringify(message));
      this.updateConnectionState('transferring');
      
      // Return promise that resolves when response is complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Prompt delegation timeout'));
        }, message.timeout);
        
        this.eventHandlers.set(`task-${taskId}`, { resolve, reject, timeout });
      });
      
    } catch (error) {
      console.error(`[P2P] Failed to delegate prompt:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming prompt from another peer
   * @param {object} message - Incoming prompt message
   * @param {string} senderId - Sender peer ID
   */
  async handleIncomingPrompt(message, senderId) {
    const { taskId, prompt } = message;
    console.log(`[P2P] Received prompt from ${senderId}:`, { taskId, prompt: prompt.substring(0, 50) + '...' });
    
    try {
      // Simulate AI processing (replace with actual AI integration)
      const response = await this.processPrompt(prompt);
      
      // Send response back in chunks
      await this.sendStreamingResponse(taskId, response, senderId);
      
    } catch (error) {
      console.error('[P2P] Failed to process incoming prompt:', error);
      this.sendErrorResponse(taskId, error.message, senderId);
    }
  }

  /**
   * Send streaming response back to requester
   * @param {string} taskId - Task ID
   * @param {string} response - Full response
   * @param {string} targetPeerId - Target peer ID
   */
  async sendStreamingResponse(taskId, response, targetPeerId) {
    const dataChannel = this.dataChannels.get(targetPeerId);
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error(`No active data channel to peer ${targetPeerId}`);
    }
    
    const chunkSize = 1000; // Send in 1KB chunks
    const chunks = [];
    
    for (let i = 0; i < response.length; i += chunkSize) {
      chunks.push(response.substring(i, i + chunkSize));
    }
    
    // Send chunks
    for (let i = 0; i < chunks.length; i++) {
      const message = {
        type: 'prompt-response',
        taskId,
        chunk: chunks[i],
        chunkIndex: i,
        totalChunks: chunks.length,
        isComplete: i === chunks.length - 1,
        metadata: {
          timestamp: Date.now(),
          size: chunks[i].length
        }
      };
      
      dataChannel.send(JSON.stringify(message));
      
      // Small delay between chunks to prevent overwhelming
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`[P2P] Sent streaming response for task ${taskId} in ${chunks.length} chunks`);
  }

  /**
   * Process prompt (placeholder for AI integration)
   * @param {string} prompt - Prompt to process
   * @returns {Promise<string>} - Response
   */
  async processPrompt(prompt) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate mock response
    const responses = [
      `Based on your query "${prompt}", here are some key insights: AI technology continues to evolve rapidly, offering new opportunities for automation and enhancement across various industries.`,
      `Regarding "${prompt}": This is an interesting question that touches on several important aspects of modern technology and its applications in real-world scenarios.`,
      `Your question about "${prompt}" highlights important considerations. The field is constantly evolving with new developments and methodologies being introduced regularly.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Send error response
   * @param {string} taskId - Task ID
   * @param {string} errorMessage - Error message
   * @param {string} targetPeerId - Target peer ID
   */
  sendErrorResponse(taskId, errorMessage, targetPeerId) {
    const dataChannel = this.dataChannels.get(targetPeerId);
    if (!dataChannel || dataChannel.readyState !== 'open') return;
    
    const message = {
      type: 'prompt-error',
      taskId,
      error: errorMessage,
      timestamp: Date.now()
    };
    
    dataChannel.send(JSON.stringify(message));
  }

  /**
   * Setup message handlers for different message types
   */
  setupMessageHandlers() {
    this.messageHandlers.set('peer-id', (message) => {
      this.peerId = message.peerId;
      console.log(`[P2P] Assigned peer ID: ${this.peerId}`);
    });
    
    this.messageHandlers.set('peer-capability-update', (message) => {
      const { peerId, capabilities } = message;
      this.peers.set(peerId, { ...capabilities, peerId });
      console.log(`[P2P] Updated capabilities for peer ${peerId}`);
      this.triggerEvent('peer-capability-update', { peerId, capabilities });
    });
    
    this.messageHandlers.set('peers-discovered', (message) => {
      const { peers } = message;
      console.log(`[P2P] Discovered ${peers.length} peers`);
      this.triggerEvent('peers-discovered', peers);
    });
    
    this.messageHandlers.set('offer', async (message) => {
      await this.handleOffer(message);
    });
    
    this.messageHandlers.set('answer', async (message) => {
      await this.handleAnswer(message);
    });
    
    this.messageHandlers.set('ice-candidate', async (message) => {
      await this.handleICECandidate(message);
    });
    
    this.messageHandlers.set('peer-disconnected', (message) => {
      const { peerId } = message;
      this.handlePeerDisconnect(peerId);
    });
    
    this.messageHandlers.set('error', (message) => {
      console.error('[P2P] Signaling error:', message.error);
    });
  }

  /**
   * Handle signaling messages
   * @param {object} message - Signaling message
   */
  handleSignalingMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.warn('[P2P] Unknown signaling message type:', message.type);
    }
  }

  /**
   * Handle WebRTC offer
   * @param {object} message - Offer message
   */
  async handleOffer(message) {
    const { fromPeerId, sdp } = message;
    console.log(`[P2P] Received offer from ${fromPeerId}`);
    
    try {
      const pc = new RTCPeerConnection(this.rtcConfig);
      this.connections.set(fromPeerId, pc);
      this.setupPeerConnection(pc, fromPeerId);
      
      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      this.sendSignalingMessage({
        type: 'answer',
        targetPeerId: fromPeerId,
        sdp: answer
      });
      
    } catch (error) {
      console.error(`[P2P] Failed to handle offer from ${fromPeerId}:`, error);
    }
  }

  /**
   * Handle WebRTC answer
   * @param {object} message - Answer message
   */
  async handleAnswer(message) {
    const { fromPeerId, sdp } = message;
    console.log(`[P2P] Received answer from ${fromPeerId}`);
    
    try {
      const pc = this.connections.get(fromPeerId);
      if (pc) {
        await pc.setRemoteDescription(sdp);
      }
    } catch (error) {
      console.error(`[P2P] Failed to handle answer from ${fromPeerId}:`, error);
    }
  }

  /**
   * Handle ICE candidate
   * @param {object} message - ICE candidate message
   */
  async handleICECandidate(message) {
    const { fromPeerId, candidate } = message;
    
    try {
      const pc = this.connections.get(fromPeerId);
      if (pc && candidate) {
        await pc.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error(`[P2P] Failed to add ICE candidate from ${fromPeerId}:`, error);
    }
  }

  /**
   * Setup peer connection event handlers
   * @param {RTCPeerConnection} pc - Peer connection
   * @param {string} peerId - Peer ID
   */
  setupPeerConnection(pc, peerId) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          targetPeerId: peerId,
          candidate: event.candidate
        });
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`[P2P] Connection state with ${peerId}: ${pc.connectionState}`);
      
      if (pc.connectionState === 'connected') {
        this.updateConnectionState('p2p-connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.handlePeerDisconnect(peerId);
      }
    };
    
    pc.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannel(dataChannel, peerId);
      this.dataChannels.set(peerId, dataChannel);
    };
  }

  /**
   * Setup data channel event handlers
   * @param {RTCDataChannel} dataChannel - Data channel
   * @param {string} peerId - Peer ID
   */
  setupDataChannel(dataChannel, peerId) {
    dataChannel.onopen = () => {
      console.log(`[P2P] Data channel opened with ${peerId}`);
      this.updateConnectionState('p2p-connected');
    };
    
    dataChannel.onclose = () => {
      console.log(`[P2P] Data channel closed with ${peerId}`);
    };
    
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleDataChannelMessage(message, peerId);
      } catch (error) {
        console.error(`[P2P] Failed to parse data channel message from ${peerId}:`, error);
      }
    };
    
    dataChannel.onerror = (error) => {
      console.error(`[P2P] Data channel error with ${peerId}:`, error);
    };
  }

  /**
   * Handle data channel messages
   * @param {object} message - Data channel message
   * @param {string} _senderId - Sender peer ID
   */
  handleDataChannelMessage(message, senderId) {
    switch (message.type) {
      case 'prompt-delegation':
        this.handleIncomingPrompt(message, senderId);
        break;
      case 'prompt-response':
        this.handlePromptResponse(message, senderId);
        break;
      case 'prompt-error':
        this.handlePromptError(message, senderId);
        break;
      default:
        console.warn(`[P2P] Unknown data channel message type: ${message.type}`);
    }
  }

  /**
   * Handle streaming prompt response
   * @param {object} message - Response message
   * @param {string} senderId - Sender peer ID
   */
  handlePromptResponse(message, senderId) {
    const { taskId, chunk, isComplete } = message;
    
    // Get task handler
    const taskHandler = this.eventHandlers.get(`task-${taskId}`);
    if (!taskHandler) return;
    
    // Initialize response buffer if needed
    if (!taskHandler.responseBuffer) {
      taskHandler.responseBuffer = '';
    }
    
    // Append chunk
    taskHandler.responseBuffer += chunk;
    
    // Trigger chunk event
    this.triggerEvent('response-chunk', { taskId, chunk, senderId });
    
    if (isComplete) {
      // Clear timeout and resolve
      clearTimeout(taskHandler.timeout);
      taskHandler.resolve(taskHandler.responseBuffer);
      this.eventHandlers.delete(`task-${taskId}`);
      this.updateConnectionState('p2p-connected');
    }
  }

  /**
   * Handle prompt error
   * @param {object} message - Error message
   * @param {string} senderId - Sender peer ID
   */
  handlePromptError(message, senderId) {
    const { taskId, error } = message;
    
    const taskHandler = this.eventHandlers.get(`task-${taskId}`);
    if (taskHandler) {
      clearTimeout(taskHandler.timeout);
      taskHandler.reject(new Error(error));
      this.eventHandlers.delete(`task-${taskId}`);
    }
  }

  /**
   * Handle peer disconnection
   * @param {string} peerId - Peer ID
   */
  handlePeerDisconnect(peerId) {
    console.log(`[P2P] Peer ${peerId} disconnected`);
    
    // Clean up connections
    const pc = this.connections.get(peerId);
    if (pc) {
      pc.close();
      this.connections.delete(peerId);
    }
    
    this.dataChannels.delete(peerId);
    this.peers.delete(peerId);
    
    this.triggerEvent('peer-disconnected', { peerId });
    
    // Update connection state if no active connections
    if (this.connections.size === 0) {
      this.updateConnectionState('connected');
    }
  }

  /**
   * Send signaling message
   * @param {object} message - Message to send
   */
  sendSignalingMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Update connection state and trigger events
   * @param {string} newState - New connection state
   */
  updateConnectionState(newState) {
    if (this.connectionState !== newState) {
      const oldState = this.connectionState;
      this.connectionState = newState;
      console.log(`[P2P] Connection state: ${oldState} -> ${newState}`);
      this.triggerEvent('connection-state-change', { oldState, newState });
    }
  }

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Trigger event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  triggerEvent(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[P2P] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Generate unique task ID
   * @returns {string} - Unique task ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection information
   * @returns {object} - Connection info
   */
  getConnectionInfo() {
    return {
      peerId: this.peerId,
      connectionState: this.connectionState,
      connectedPeers: Array.from(this.connections.keys()),
      availablePeers: Array.from(this.peers.keys()),
      peerCount: this.peers.size
    };
  }

  /**
   * Disconnect from all peers and signaling server
   */
  disconnect() {
    console.log('[P2P] Disconnecting from all peers and signaling server');
    
    // Close all peer connections
    for (const [_peerId, pc] of this.connections.entries()) {
      pc.close();
    }
    
    // Close signaling connection
    if (this.ws) {
      this.ws.close();
    }
    
    // Clear state
    this.connections.clear();
    this.dataChannels.clear();
    this.peers.clear();
    this.eventHandlers.clear();
    this.updateConnectionState('disconnected');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedP2PManager;
}

// Global assignment for script tag usage
if (typeof window !== 'undefined') {
  window.EnhancedP2PManager = EnhancedP2PManager;
}