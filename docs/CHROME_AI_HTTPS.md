# Chrome AI HTTPS Setup for Local Development

Chrome AI requires HTTPS to function properly in local development. This guide explains how to set up HTTPS support for the P2P demo application.

## Prerequisites

1. **OpenSSL** must be installed on your system
2. **Node.js** v18 or later
3. **Chrome** 127 or later with AI features enabled

## Quick Start

1. **Start the HTTPS development server:**

   ```bash
   npm run dev:https
   ```

2. **Add hostname aliases to your hosts file:**
   - **Windows:** Edit `C:\Windows\System32\drivers\etc\hosts`
   - **macOS/Linux:** Edit `/etc/hosts`

   Add these lines:

   ```
   127.0.0.1    share-in.local
   127.0.0.1    p2p-demo.local
   ```

3. **Access the P2P demo:**
   - HTTP: http://localhost:9082
   - HTTPS: https://localhost:9443
   - HTTPS with alias: https://share-in.local:9443

4. **Trust the certificate:**
   When you first visit the HTTPS URLs, your browser will show a security warning about the self-signed certificate. You have several options:

   **Option A: Chrome Launch Flags (Recommended for Development)**
   Start Chrome with flags to bypass certificate errors for localhost:

   ```bash
   # Windows
   chrome.exe --ignore-certificate-errors --allow-running-insecure-content --ignore-ssl-errors

   # macOS
   open -a "Google Chrome" --args --ignore-certificate-errors --allow-running-insecure-content --ignore-ssl-errors

   # Linux
   google-chrome --ignore-certificate-errors --allow-running-insecure-content --ignore-ssl-errors
   ```

   **Option B: Automated Trust Helper**
   Use the built-in trust helper script:

   ```bash
   npm run dev:cert:trust
   ```

   **Option C: Manual Trust (Windows)**
   1. Visit https://localhost:9443
   2. Click "Advanced" → "Proceed to localhost"
   3. For permanent trust:
      - Download the certificate (click the lock icon in address bar → Certificate is not valid → Details → Copy to File)
      - Install in "Trusted Root Certification Authorities" store

   **Option D: PowerShell Installation (Windows)**
   Run as Administrator:

   ```bash
   npm run dev:cert:install
   ```

   **Option E: Manual Trust (macOS)**
   1. Visit https://localhost:9443
   2. Click "Advanced" → "Proceed to localhost"
   3. For permanent trust:
      - Download the certificate (click the lock icon in address bar → Certificate Viewer → Drag to Desktop)
      - Open Keychain Access → drag certificate to "System" keychain
      - Double-click certificate → Trust → "Always Trust"

## Chrome AI Configuration

1. **Enable Chrome AI flags:**
   - Go to `chrome://flags/#optimization-guide-on-device-model`
   - Set to **Enabled**
   - Go to `chrome://flags/#prompt-api-for-gemini-nano`
   - Set to **Enabled**
   - Restart Chrome

2. **Download the Gemini Nano model:**
   - Go to `chrome://components/`
   - Find "Optimization Guide On Device Model"
   - Click "Check for update"
   - Wait for download (10-30 minutes)
   - Restart Chrome after download

## Testing Chrome AI

1. Visit https://share-in.local:9443
2. Enter a prompt in the "Task Delegation" section
3. Select "Force Local" or "Auto (Smart Routing)"
4. Chrome AI should process the prompt locally

## Troubleshooting

### Certificate Issues

If you see certificate errors:

1. Make sure you've added the hosts file entries
2. Accept the certificate warning in your browser
3. Try refreshing the page

### Windows Certificate Trust

To permanently trust the development certificate on Windows:

1. **Export the certificate:**
   - Visit https://localhost:9443 in Chrome
   - Click the lock icon next to the URL
   - Click "Certificate is not valid"
   - Go to Details tab
   - Click "Copy to File..."
   - Choose "Base-64 encoded X.509 (.CER)" format
   - Save as `helios-dev-cert.cer`

2. **Install in Trusted Store:**
   - Press Win+R, type `certmgr.msc`, press Enter
   - Right-click "Trusted Root Certification Authorities"
   - All Tasks → Import
   - Select the saved certificate file
   - Confirm security warning

3. **Restart Chrome** to recognize the trusted certificate

### Chrome AI Not Detected

If Chrome AI is still not available:

1. Verify Chrome version is 127+
2. Check that all flags are enabled
3. Confirm the model has downloaded
4. Try restarting Chrome completely

### Port Conflicts

If you see "address already in use" errors:

```bash
npx kill-port 9082 9443
npm run dev:https
```

## How It Works

1. **Self-signed certificates** are automatically generated for localhost and the aliases
2. **HTTPS server** runs on port 9443 with proper SSL/TLS configuration
3. **HTTP server** runs on port 9082 for compatibility
4. **Hostname aliases** bypass Chrome's localhost restrictions for AI features

## Security Notes

- These certificates are for **local development only**
- Never use these certificates in production
- The certificates are self-signed and will show browser warnings
- This is normal and expected for local development
