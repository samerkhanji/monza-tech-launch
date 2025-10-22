# 🦀 Tauri Setup for Monza TECH

## Why Tauri?
- **10MB app** instead of 150MB (Electron)
- **Better performance** - native Rust backend
- **Better security** - no Node.js runtime
- **Same web frontend** - your React app works as-is

## Quick Setup Steps:

1. **Install Rust:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs/ | sh

# On Windows, download from: https://rustup.rs/
```

2. **Install Tauri CLI:**
```bash
npm install -g @tauri-apps/cli
```

3. **Add Tauri to your project:**
```bash
npm install @tauri-apps/api
npx tauri init
```

4. **Configure tauri.conf.json:**
```json
{
  "build": {
    "distDir": "../dist",
    "devPath": "http://localhost:5173"
  },
  "package": {
    "productName": "Monza TECH",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.monzatech.monza",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 900,
        "resizable": true,
        "title": "Monza TECH",
        "width": 1400
      }
    ]
  }
}
```

5. **Build:**
```bash
npm run build
npx tauri build
```

## License System for Tauri:
You can implement the same license verification in Rust in `src-tauri/src/main.rs`
