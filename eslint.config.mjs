export default [
  // Browser environment for P2P demo frontend
  {
    files: ["apps/p2p-demo/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser DOM globals
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        console: "readonly",
        
        // Browser APIs
        WebSocket: "readonly",
        RTCPeerConnection: "readonly",
        RTCDataChannel: "readonly",
        RTCSessionDescription: "readonly",
        RTCIceCandidate: "readonly",
        fetch: "readonly",
        performance: "readonly",
        crypto: "readonly",
        
        // Browser timers
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        
        // P2P Demo Classes (global references)
        EnhancedP2PManager: "readonly",
        QuotaMonitor: "readonly",
        SecurityManager: "readonly",
        app: "writable",
        
        // Module system (for compatibility)
        module: "writable",
        exports: "writable"
      }
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  },
  
  // Chrome extension environment
  {
    files: ["apps/extension/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser DOM globals
        document: "readonly",
        window: "readonly",
        console: "readonly",
        
        // Chrome Extension APIs
        chrome: "readonly"
      }
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  },
  
  // Node.js environment for services, scripts, agents
  {
    files: ["services/**/*.{js,mjs}", "scripts/**/*.{js,mjs}", "agents/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals
        global: "readonly",
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        
        // Node.js timers
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        
        // Node.js modules (CommonJS)
        module: "readonly",
        exports: "readonly",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        
        // Node.js built-ins
        URL: "readonly",
        URLSearchParams: "readonly"
      }
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  },
  
  // Test environment
  {
    files: ["tests/**/*.{js,mjs}", "**/*.test.{js,mjs}", "**/*.spec.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals for testing
        global: "readonly",
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        
        // Test globals (for future test frameworks)
        test: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  },
  
  // Default configuration for other files
  {
    files: ["**/*.{js,mjs,cjs}"],
    ignores: [
      "**/node_modules/**",
      "dist/**",
      "docs/**",
      "**/*.md",
      "apps/p2p-demo/**/*.js", // Handled by browser config
      "apps/extension/**/*.js", // Handled by Chrome extension config
      "services/**/*.{js,mjs}", // Handled by Node.js config
      "scripts/**/*.{js,mjs}", // Handled by Node.js config
      "agents/**/*.{js,mjs}", // Handled by Node.js config
      "tests/**/*.{js,mjs}" // Handled by test config
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly"
      }
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  }
];
