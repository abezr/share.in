# P2P Prompt API Delegation Setup Guide

## 🚀 Quick Start

This guide walks you through setting up the P2P Prompt API delegation system with Chrome AI integration.

## 📋 Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **Modern Browser**: Chrome 127+ (recommended) or Edge 127+
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Network**: Internet connection for STUN servers and origin trial registration

### Chrome AI Requirements

- Chrome Canary, Dev, or Beta channel (stable channel support coming soon)
- Chrome AI origin trial token (see below)
- Experimental AI features enabled

## 🔧 Chrome AI Setup

### Step 1: Enable Chrome AI Features

1. **Open Chrome Flags**:

   ```
   chrome://flags/
   ```

2. **Enable Required Flags**:
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
   - `#gemini-nano-trial` → **Enabled**

3. **Restart Chrome** after enabling flags

### Step 2: Register for Origin Trial

1. **Visit Chrome Origin Trials**:

   ```
   https://developer.chrome.com/origintrials/
   ```

2. **Register for "Prompt API for Gemini Nano"**:
   - Sign in with your Google account
   - Enter your domain (e.g., `localhost:8082` for development)
   - Generate origin trial token

3. **Add Token to Your HTML**:
   ```html
   <meta http-equiv="origin-trial" content="YOUR_ORIGIN_TRIAL_TOKEN_HERE" />
   ```

### Step 3: Verify AI Availability

1. **Open Browser Console** (F12)
2. **Check AI Availability**:

   ```javascript
   console.log('AI available:', window.ai);
   console.log('Language model:', await window.ai?.languageModel?.capabilities());
   ```

3. **Expected Output**:
   ```
   AI available: Object { languageModel: ... }
   Language model: { available: "readily", defaultTopK: 3, maxTopK: 8, ... }
   ```

## 📦 Project Setup

### Step 1: Clone and Install Dependencies

```bash
# Navigate to your project directory
cd /path/to/your/project

# Install signaling server dependencies
cd services/signaling
npm install

# Return to project root
cd ../..
```

### Step 2: Environment Configuration

Create a `.env` file in the project root:

```env
# Server Ports
SIGNALING_PORT=8083
P2P_PORT=8082
OFFERS_PORT=8081

# WebRTC Configuration
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# Development Settings
NODE_ENV=development
DEBUG=true

# Chrome AI Settings
AI_MODEL_NAME=gemini-nano
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

### Step 3: SSL Certificate (HTTPS Development)

For production or testing with remote peers, you'll need HTTPS:

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Move certificates to project root
mv key.pem cert.pem /path/to/your/project/
```

## 🚀 Running the System

### Method 1: Using Development Script (Recommended)

```bash
# Start all services
npm run dev
```

This starts:

- Signaling server on port 8083
- P2P demo server on port 8082
- Offers service on port 8081

### Method 2: Manual Start

#### Terminal 1 - Signaling Server

```bash
cd services/signaling
node index.mjs
```

#### Terminal 2 - P2P Demo Server

```bash
cd apps/p2p-demo
python -m http.server 8082
# Or use Node.js:
# npx http-server -p 8082
```

#### Terminal 3 - Offers Service (Optional)

```bash
cd services/offers
node index.mjs
```

### Method 3: Docker Setup (Alternative)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN cd services/signaling && npm install

EXPOSE 8082 8083

CMD ["npm", "run", "dev"]
```

```bash
# Build and run
docker build -t p2p-prompt-api .
docker run -p 8082:8082 -p 8083:8083 p2p-prompt-api
```

## 🧪 Testing the Setup

### Step 1: Verify Services

1. **Check Signaling Server**:

   ```bash
   curl http://localhost:8083/health
   # Expected: {"status":"ok","connections":0}
   ```

2. **Check P2P Demo**:
   ```bash
   curl http://localhost:8082
   # Expected: HTML content
   ```

### Step 2: Browser Testing

1. **Open Demo Page**:

   ```
   http://localhost:8082
   ```

2. **Check Console** for any errors:

   ```javascript
   // Should see initialization messages
   console.log('P2P Manager initialized');
   console.log('Prompt API Manager initialized');
   ```

3. **Test AI Connection**:
   - Click "Initialize AI" button
   - Check status indicators turn green
   - Verify quota displays show values

### Step 3: Multi-Browser Testing

1. **Open Two Browser Windows**:
   - Window 1: `http://localhost:8082`
   - Window 2: `http://localhost:8082` (incognito/private mode)

2. **Connect Peers**:
   - Click "Connect to Signaling Server" in both windows
   - Wait for "Connected to signaling server" status

3. **Test Delegation**:
   - Enter a prompt in Window 1: "What is AI?"
   - Click "Execute Prompt"
   - Observe delegation to Window 2 if Window 1 has low quota

### Step 4: Run Automated Tests

```bash
# Unit tests
node tests/p2p-prompt-delegation.test.mjs

# Integration tests
node tests/p2p-integration.test.mjs
```

## 🔍 Troubleshooting

### Common Issues

#### Issue: "AI is not available"

**Symptoms**: `window.ai` is undefined
**Solutions**:

1. Verify Chrome version (127+)
2. Check Chrome flags are enabled
3. Ensure origin trial token is valid
4. Try Chrome Canary/Dev channel

#### Issue: "Origin trial token invalid"

**Symptoms**: AI features disabled in production
**Solutions**:

1. Re-register for origin trial with correct domain
2. Check token expiration date
3. Ensure HTTPS for production domains
4. Verify meta tag placement in HTML head

#### Issue: "Signaling server connection failed"

**Symptoms**: WebSocket connection errors
**Solutions**:

1. Check if signaling server is running
2. Verify port 8083 is not blocked
3. Check firewall settings
4. Try different port in .env file

#### Issue: "WebRTC connection failed"

**Symptoms**: Peers can't connect directly
**Solutions**:

1. Check STUN server configuration
2. Verify network allows WebRTC
3. Consider TURN server for corporate networks
4. Check browser WebRTC settings

#### Issue: "Quota monitoring not working"

**Symptoms**: Quota always shows maximum
**Solutions**:

1. Clear browser storage and reload
2. Check localStorage permissions
3. Verify quota tracking initialization
4. Review browser console for errors

### Debug Mode

Enable debug logging:

```javascript
// Add to browser console
localStorage.setItem('p2p-debug', 'true');
location.reload();
```

View debug logs:

```javascript
// Check debug information
console.log(window.debugInfo);
```

### Performance Issues

#### Slow Connection Times

1. Check network latency to STUN servers
2. Reduce ICE candidate gathering timeout
3. Use local STUN server for development

#### High Memory Usage

1. Enable performance optimizer
2. Adjust connection pool settings
3. Monitor request cleanup intervals

## 🔒 Security Considerations

### Development Environment

- Use self-signed certificates for HTTPS
- Restrict access to localhost only
- Enable CORS for cross-origin testing

### Production Environment

- Use valid SSL certificates
- Implement proper authentication
- Add rate limiting and DDoS protection
- Monitor and log all API access

### Chrome AI Security

- Validate all prompt inputs
- Implement content filtering
- Monitor quota usage patterns
- Log security events

## 🌐 Deployment Options

### Local Development

```bash
# Simple HTTP server
npm run dev
```

### Cloud Deployment

#### Heroku

```bash
# Create Procfile
echo "web: node scripts/dev.mjs" > Procfile

# Deploy
heroku create your-app-name
git push heroku main
```

#### AWS EC2

```bash
# Install Node.js on EC2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup project
git clone your-repo
cd your-project
npm run dev
```

#### Docker Container

```yaml
# docker-compose.yml
version: '3.8'
services:
  p2p-prompt-api:
    build: .
    ports:
      - '8082:8082'
      - '8083:8083'
    environment:
      - NODE_ENV=production
```

### HTTPS Configuration

#### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /signaling {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 📊 Monitoring and Metrics

### Built-in Monitoring

Access monitoring dashboard:

```
http://localhost:8082/monitor
```

### Custom Metrics

Add custom monitoring:

```javascript
// Monitor AI usage
window.aiMetrics = {
  promptsExecuted: 0,
  delegatedRequests: 0,
  averageResponseTime: 0,
};

// Track in your application
function trackAIUsage(responseTime) {
  window.aiMetrics.promptsExecuted++;
  window.aiMetrics.averageResponseTime = (window.aiMetrics.averageResponseTime + responseTime) / 2;
}
```

### Performance Monitoring

Enable performance tracking:

```javascript
// Add to app initialization
const perfOptimizer = new PerformanceOptimizer({
  enableOptimization: true,
  connectionPool: { maxConnections: 20 },
  requestCleanup: { maxRequestAge: 300000 },
});
```

## 🔄 Updates and Maintenance

### Keeping Up to Date

1. **Monitor Chrome AI Updates**:
   - Follow Chrome Developer Blog
   - Check origin trial status regularly
   - Update tokens before expiration

2. **Project Updates**:

   ```bash
   # Update dependencies
   cd services/signaling && npm update

   # Check for security updates
   npm audit
   ```

3. **Browser Compatibility**:
   - Test with latest Chrome versions
   - Monitor WebRTC API changes
   - Update feature detection code

### Backup and Recovery

1. **Configuration Backup**:

   ```bash
   # Backup configuration
   cp .env .env.backup
   cp services/signaling/package.json services/signaling/package.json.backup
   ```

2. **Data Recovery**:
   ```javascript
   // Export quota data
   const quotaData = localStorage.getItem('quotaMonitor');
   console.log('Quota backup:', quotaData);
   ```

## 📚 Additional Resources

### Official Documentation

- [Chrome AI Origin Trials](https://developer.chrome.com/origintrials/)
- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Chrome AI Developer Guide](https://developer.chrome.com/docs/ai/)

### Community Resources

- [Chrome AI GitHub Discussions](https://github.com/GoogleChrome/chrome-ai)
- [WebRTC Community Forum](https://groups.google.com/forum/#!forum/webrtc)
- [P2P Development Best Practices](https://webrtc.org/getting-started/)

### Development Tools

- [Chrome DevTools WebRTC](chrome://webrtc-internals/)
- [WebRTC Troubleshooter](https://test.webrtc.org/)
- [AI Model Testing Tools](chrome://components/)

## 🎯 Next Steps

1. **Explore Advanced Features**:
   - Implement custom AI models
   - Add voice prompt support
   - Create mobile app integration

2. **Scale Your Deployment**:
   - Set up load balancing
   - Implement database storage
   - Add user authentication

3. **Contribute to the Project**:
   - Submit bug reports
   - Propose new features
   - Share your implementations

---

## 🆘 Support

If you encounter issues not covered in this guide:

1. **Check the logs**: Browser console and server logs
2. **Review the API documentation**: `docs/API_DOCUMENTATION.md`
3. **Run the test suite**: Verify your setup with automated tests
4. **Check GitHub issues**: Search for similar problems
5. **Create a detailed bug report**: Include logs, browser version, and steps to reproduce

Happy coding with P2P Prompt API Delegation! 🚀
