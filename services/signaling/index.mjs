import { WebSocketServer } from 'ws';
import http from 'node:http';
import { randomUUID } from 'node:crypto';

/**
 * P2P Signaling Server for WebRTC connection establishment
 * Manages peer discovery, capability exchange, and WebRTC signaling
 */
class SignalingServer {
  constructor(port = 8083) {
    this.port = port;
    this.peers = new Map(); // Map<peerId, PeerConnection>
    this.capabilities = new Map(); // Map<peerId, capabilities>
    this.connectionQueue = []; // Peers waiting for connection
    this.rateLimits = new Map(); // Map<peerId, {count, lastReset}>
    
    this.setupServer();
  }

  setupServer() {
    // Create HTTP server for health checks
    this.httpServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          connections: this.peers.size,
          capabilities: this.capabilities.size
        }));
        return;
      }
      
      res.writeHead(404);
      res.end('Not Found');
    });

    // Create WebSocket server
    this.wss = new WebSocketServer({ 
      server: this.httpServer,
      path: '/signaling'
    });

    this.wss.on('connection', (ws, req) => {
      const peerId = randomUUID();
      const clientInfo = {
        id: peerId,
        ws,
        ip: req.socket.remoteAddress,
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };

      this.peers.set(peerId, clientInfo);
      console.log(`[Signaling] Peer ${peerId} connected from ${clientInfo.ip}`);

      // Send peer ID to client
      this.sendMessage(ws, {
        type: 'peer-id',
        peerId: peerId
      });

      // Setup message handlers
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(peerId, message);
        } catch (error) {
          console.error(`[Signaling] Invalid JSON from ${peerId}:`, error.message);
          this.sendError(ws, 'invalid-json', 'Message must be valid JSON');
        }
      });

      ws.on('close', () => {
        console.log(`[Signaling] Peer ${peerId} disconnected`);
        this.handlePeerDisconnect(peerId);
      });

      ws.on('error', (error) => {
        console.error(`[Signaling] WebSocket error for ${peerId}:`, error.message);
        this.handlePeerDisconnect(peerId);
      });

      // Update last activity
      ws.on('pong', () => {
        if (this.peers.has(peerId)) {
          this.peers.get(peerId).lastActivity = Date.now();
        }
      });
    });

    // Start connection cleanup interval
    this.startHeartbeat();
  }

  handleMessage(peerId, message) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    // Rate limiting
    if (!this.checkRateLimit(peerId)) {
      this.sendError(peer.ws, 'rate-limit', 'Too many requests');
      return;
    }

    // Update last activity
    peer.lastActivity = Date.now();

    console.log(`[Signaling] Message from ${peerId}:`, message.type);

    switch (message.type) {
      case 'capability-announce':
        this.handleCapabilityAnnounce(peerId, message);
        break;
      case 'discover':
        this.handlePeerDiscovery(peerId, message);
        break;
      case 'offer':
        this.handleWebRTCOffer(peerId, message);
        break;
      case 'answer':
        this.handleWebRTCAnswer(peerId, message);
        break;
      case 'ice-candidate':
        this.handleICECandidate(peerId, message);
        break;
      case 'ping':
        this.sendMessage(peer.ws, { type: 'pong' });
        break;
      default:
        this.sendError(peer.ws, 'unknown-type', `Unknown message type: ${message.type}`);
    }
  }

  handleCapabilityAnnounce(peerId, message) {
    const { capabilities } = message;
    
    if (!capabilities || typeof capabilities !== 'object') {
      this.sendError(this.peers.get(peerId).ws, 'invalid-capabilities', 'Capabilities must be an object');
      return;
    }

    // Store capabilities
    this.capabilities.set(peerId, {
      ...capabilities,
      announcedAt: Date.now(),
      peerId
    });

    console.log(`[Signaling] Capabilities announced for ${peerId}:`, capabilities);

    // Broadcast capability update to all other peers
    this.broadcastToOthers(peerId, {
      type: 'peer-capability-update',
      peerId,
      capabilities
    });

    // Send existing peer capabilities to this peer
    this.sendExistingCapabilities(peerId);
  }

  handlePeerDiscovery(peerId, message) {
    const { requirements } = message;
    const matchingPeers = this.findMatchingPeers(peerId, requirements);
    
    const peer = this.peers.get(peerId);
    this.sendMessage(peer.ws, {
      type: 'peers-discovered',
      peers: matchingPeers
    });

    console.log(`[Signaling] Discovery for ${peerId} found ${matchingPeers.length} matching peers`);
  }

  handleWebRTCOffer(peerId, message) {
    const { targetPeerId, sdp } = message;
    const targetPeer = this.peers.get(targetPeerId);
    
    if (!targetPeer) {
      this.sendError(this.peers.get(peerId).ws, 'peer-not-found', 'Target peer not connected');
      return;
    }

    this.sendMessage(targetPeer.ws, {
      type: 'offer',
      fromPeerId: peerId,
      sdp
    });

    console.log(`[Signaling] WebRTC offer forwarded from ${peerId} to ${targetPeerId}`);
  }

  handleWebRTCAnswer(peerId, message) {
    const { targetPeerId, sdp } = message;
    const targetPeer = this.peers.get(targetPeerId);
    
    if (!targetPeer) {
      this.sendError(this.peers.get(peerId).ws, 'peer-not-found', 'Target peer not connected');
      return;
    }

    this.sendMessage(targetPeer.ws, {
      type: 'answer',
      fromPeerId: peerId,
      sdp
    });

    console.log(`[Signaling] WebRTC answer forwarded from ${peerId} to ${targetPeerId}`);
  }

  handleICECandidate(peerId, message) {
    const { targetPeerId, candidate } = message;
    const targetPeer = this.peers.get(targetPeerId);
    
    if (!targetPeer) {
      this.sendError(this.peers.get(peerId).ws, 'peer-not-found', 'Target peer not connected');
      return;
    }

    this.sendMessage(targetPeer.ws, {
      type: 'ice-candidate',
      fromPeerId: peerId,
      candidate
    });
  }

  findMatchingPeers(requesterId, requirements = {}) {
    const matchingPeers = [];
    
    for (const [peerId, capabilities] of this.capabilities.entries()) {
      if (peerId === requesterId) continue; // Don't match self
      
      const peer = this.peers.get(peerId);
      if (!peer || peer.ws.readyState !== peer.ws.OPEN) continue; // Skip disconnected peers
      
      let matches = true;
      
      // Check AI capability requirement
      if (requirements.needsAI && !capabilities.hasAI) {
        matches = false;
      }
      
      // Check minimum quota requirement
      if (requirements.minQuota && capabilities.quota && 
          capabilities.quota.availableQuota < requirements.minQuota) {
        matches = false;
      }
      
      // Check preferred models
      if (requirements.preferredModels && capabilities.models) {
        const hasPreferredModel = requirements.preferredModels.some(model => 
          capabilities.models.includes(model)
        );
        if (!hasPreferredModel) {
          matches = false;
        }
      }
      
      if (matches) {
        matchingPeers.push({
          peerId,
          capabilities,
          performance: capabilities.performance || {},
          lastSeen: peer.lastActivity
        });
      }
    }
    
    // Sort by performance score (best first)
    return matchingPeers.sort((a, b) => {
      const scoreA = this.calculatePeerScore(a);
      const scoreB = this.calculatePeerScore(b);
      return scoreB - scoreA;
    });
  }

  calculatePeerScore(peer) {
    let score = 0;
    const { capabilities, performance } = peer;
    
    // Quota availability weight (40%)
    if (capabilities.quota) {
      score += capabilities.quota.availableQuota * 0.4;
    }
    
    // Low latency bonus (30 points if <100ms)
    if (performance.latency && performance.latency < 100) {
      score += 30;
    }
    
    // Model variety weight (10% per model)
    if (capabilities.models) {
      score += capabilities.models.length * 0.1;
    }
    
    // Recent activity bonus
    const minutesAgo = (Date.now() - peer.lastSeen) / (1000 * 60);
    if (minutesAgo < 5) {
      score += 10;
    }
    
    return score;
  }

  sendExistingCapabilities(peerId) {
    const peer = this.peers.get(peerId);
    
    for (const [existingPeerId, capabilities] of this.capabilities.entries()) {
      if (existingPeerId !== peerId) { // Don't send peer its own capabilities
        this.sendMessage(peer.ws, {
          type: 'peer-capability-update',
          peerId: existingPeerId,
          capabilities
        });
      }
    }
  }

  broadcastToOthers(excludePeerId, message) {
    for (const [peerId, peer] of this.peers.entries()) {
      if (peerId !== excludePeerId && peer.ws.readyState === peer.ws.OPEN) {
        this.sendMessage(peer.ws, message);
      }
    }
  }

  sendMessage(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, code, message) {
    this.sendMessage(ws, {
      type: 'error',
      error: { code, message }
    });
  }

  checkRateLimit(peerId) {
    const now = Date.now();
    const limit = this.rateLimits.get(peerId);
    
    if (!limit) {
      this.rateLimits.set(peerId, { count: 1, lastReset: now });
      return true;
    }
    
    // Reset count every minute
    if (now - limit.lastReset > 60000) {
      limit.count = 1;
      limit.lastReset = now;
      return true;
    }
    
    // Allow up to 100 messages per minute
    if (limit.count >= 100) {
      return false;
    }
    
    limit.count++;
    return true;
  }

  handlePeerDisconnect(peerId) {
    this.peers.delete(peerId);
    this.capabilities.delete(peerId);
    this.rateLimits.delete(peerId);
    
    // Notify other peers about disconnection
    this.broadcastToOthers(peerId, {
      type: 'peer-disconnected',
      peerId
    });
  }

  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes
      
      for (const [peerId, peer] of this.peers.entries()) {
        if (now - peer.lastActivity > staleThreshold) {
          console.log(`[Signaling] Cleaning up stale peer ${peerId}`);
          peer.ws.terminate();
          this.handlePeerDisconnect(peerId);
        } else {
          // Send ping to active connections
          peer.ws.ping();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  start() {
    this.httpServer.listen(this.port, () => {
      console.log(`[Signaling] Server running on port ${this.port}`);
      console.log(`[Signaling] WebSocket endpoint: ws://localhost:${this.port}/signaling`);
      console.log(`[Signaling] Health check: http://localhost:${this.port}/health`);
    });
  }

  stop() {
    console.log('[Signaling] Shutting down server...');
    this.wss.close();
    this.httpServer.close();
  }
}

// Start server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.SIGNALING_PORT ? Number(process.env.SIGNALING_PORT) : 8083;
  const server = new SignalingServer(port);
  
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    server.stop();
    process.exit(0);
  });
}

export { SignalingServer };