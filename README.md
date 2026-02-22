# Uncharted Waters 2 - Electron Desktop App

This is an Electron wrapper for the Uncharted Waters 2 DOS game emulator, allowing you to run the game as a standalone desktop application.

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Install dependencies:
```bash
npm install
cd unchartedwaters2 && npm install && cd ..
```

## Development

To run the application in development mode:

```bash
NODE_ENV=development npm run dev
```

This will build the web app and launch the Electron application with DevTools enabled.

## Building

To build the web application:

```bash
npm run build
```

To package the Electron app for distribution:

```bash
# Build for all platforms
npm run build:all

# Or build for specific platforms
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux
```

The packaged applications will be available in the `release/` directory.

## Running

After building, you can run the app with:

```bash
npm start
```

## Features

- Standalone desktop application
- Full keyboard and gamepad support
- Save/Load game functionality
- Fullscreen mode (F11 or Ctrl+Cmd+F on Mac)
- Zoom controls
- Developer tools access (Ctrl+Shift+I or Alt+Cmd+I on Mac)

## Project Structure

- `main.js` - Electron main process
- `preload.js` - Preload script for secure context bridging
- `unchartedwaters2/` - Web application source
- `release/` - Built application packages
