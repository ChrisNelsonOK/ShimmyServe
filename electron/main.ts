import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { spawn, ChildProcess } from 'node:child_process'

// Import services
import { initializeDatabase } from '../src/lib/db/index.js'
import { AuthService } from '../src/lib/auth/index.js'
import { ShimmyServerService } from '../src/lib/shimmy/server.js'
import { LoggingService } from '../src/lib/logging/index.js'
import { KnowledgeBaseService } from '../src/lib/knowledge/index.js'
import { SimpleTerminalService } from '../src/lib/terminal/simple.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main.js    > Electron main
// │ └─┬ preload.js > Preload scripts
// ├─┬ dist
// │ └── index.html  > Electron renderer
//
process.env.DIST_ELECTRON = path.join(__dirname, '../')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This is only for development and should be removed in production
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
let shimmyProcess: ChildProcess | null = null
let shimmyServerLogs: string[] = []
const MAX_LOG_LINES = 1000

// Initialize services
let authService: AuthService
let shimmyServerService: ShimmyServerService
let loggingService: LoggingService
let knowledgeBaseService: KnowledgeBaseService
let terminalService: SimpleTerminalService

// Here, you can also use other preload
const preload = path.join(__dirname, '../dist-electron/preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'ShimmyServe',
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  })

  // Apply dark theme
  win.webContents.on('did-finish-load', () => {
    win?.webContents.insertCSS(`
      :root {
        color-scheme: dark;
      }
      body {
        background-color: #0a0a0a !important;
        color: #ffffff !important;
      }
    `)
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show()
    
    // Focus on window on creation
    if (process.platform === 'darwin') {
      win?.focus()
    }
  })

  // Handle window closed
  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(async () => {
  await initializeServices()
  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  // Stop Shimmy process if running
  if (shimmyProcess) {
    shimmyProcess.kill()
    shimmyProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// Helper functions for Shimmy server management
function getShimmyBinaryPath(): string {
  const platform = process.platform
  const arch = process.arch

  let binaryName = 'shimmy'
  if (platform === 'win32') {
    binaryName = 'shimmy.exe'
  }

  // In development, look in resources folder
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'resources', 'shimmy', platform, arch, binaryName)
  }

  // In production, look in app resources
  return path.join(process.resourcesPath, 'shimmy', platform, arch, binaryName)
}

function addToLogBuffer(output: string) {
  const lines = output.split('\n').filter(line => line.trim())
  shimmyServerLogs.push(...lines)

  // Keep buffer size under control
  if (shimmyServerLogs.length > MAX_LOG_LINES) {
    shimmyServerLogs = shimmyServerLogs.slice(-MAX_LOG_LINES)
  }

  // Send logs to renderer if window exists
  if (win && !win.isDestroyed()) {
    win.webContents.send('shimmy:logs', lines)
  }
}

function buildServerArgs(config: any): string[] {
  const args: string[] = []

  // Basic server options
  args.push('serve')
  args.push('--host', config.host || '127.0.0.1')
  args.push('--port', (config.port || 11435).toString())

  // Model configuration
  if (config.modelPath) {
    args.push('--model', config.modelPath)
  }

  if (config.contextSize) {
    args.push('--ctx-size', config.contextSize.toString())
  }

  if (config.batchSize) {
    args.push('--batch-size', config.batchSize.toString())
  }

  if (config.gpuLayers !== undefined) {
    args.push('--n-gpu-layers', config.gpuLayers.toString())
  }

  // Generation parameters
  if (config.temperature !== undefined) {
    args.push('--temp', config.temperature.toString())
  }

  if (config.topP !== undefined) {
    args.push('--top-p', config.topP.toString())
  }

  if (config.topK !== undefined) {
    args.push('--top-k', config.topK.toString())
  }

  if (config.repeatPenalty !== undefined) {
    args.push('--repeat-penalty', config.repeatPenalty.toString())
  }

  // Additional custom arguments
  if (config.additionalArgs && Array.isArray(config.additionalArgs)) {
    args.push(...config.additionalArgs)
  }

  return args
}

// IPC handlers for Shimmy server management
ipcMain.handle('shimmy:start', async (event, config) => {
  try {
    if (shimmyProcess) {
      return { success: false, error: 'Shimmy is already running' }
    }

    const binaryPath = getShimmyBinaryPath()

    // Check if binary exists
    if (!require('fs').existsSync(binaryPath)) {
      return { success: false, error: `Shimmy binary not found at: ${binaryPath}` }
    }

    // Build command line arguments
    const args = buildServerArgs(config)

    console.log('Starting Shimmy server:', binaryPath, args)

    // Spawn the server process
    shimmyProcess = spawn(binaryPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        SHIMMY_HOST: config.host || '127.0.0.1',
        SHIMMY_PORT: (config.port || 11435).toString(),
      }
    })

    // Handle server output
    shimmyProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      addToLogBuffer(`[STDOUT] ${output}`)
    })

    shimmyProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      addToLogBuffer(`[STDERR] ${output}`)
    })

    // Handle server exit
    shimmyProcess.on('exit', (code, signal) => {
      console.log(`Shimmy server exited with code ${code}, signal ${signal}`)
      addToLogBuffer(`[SYSTEM] Server exited with code ${code}, signal ${signal}`)

      if (win && !win.isDestroyed()) {
        win.webContents.send('shimmy:status-changed', 'stopped')
      }

      shimmyProcess = null
    })

    shimmyProcess.on('error', (error) => {
      console.error('Shimmy server error:', error)
      addToLogBuffer(`[ERROR] ${error.message}`)

      if (win && !win.isDestroyed()) {
        win.webContents.send('shimmy:status-changed', 'error')
      }

      shimmyProcess = null
    })

    // Wait a moment to see if the process starts successfully
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (shimmyProcess && !shimmyProcess.killed) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('shimmy:status-changed', 'running')
      }
      return { success: true, message: 'Shimmy server started', pid: shimmyProcess.pid }
    } else {
      return { success: false, error: 'Server failed to start' }
    }
  } catch (error) {
    console.error('Failed to start Shimmy server:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('shimmy:stop', async () => {
  try {
    if (shimmyProcess) {
      // Try graceful shutdown first
      shimmyProcess.kill('SIGTERM')

      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if graceful shutdown takes too long
          if (shimmyProcess) {
            console.log('Force killing Shimmy server process')
            shimmyProcess.kill('SIGKILL')
          }
          resolve()
        }, 5000)

        shimmyProcess?.on('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      shimmyProcess = null

      if (win && !win.isDestroyed()) {
        win.webContents.send('shimmy:status-changed', 'stopped')
      }

      return { success: true, message: 'Shimmy server stopped' }
    }
    return { success: false, error: 'Shimmy is not running' }
  } catch (error) {
    console.error('Failed to stop Shimmy server:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('shimmy:status', async () => {
  return {
    running: shimmyProcess !== null,
    pid: shimmyProcess?.pid || null,
    binaryPath: getShimmyBinaryPath(),
    binaryExists: require('fs').existsSync(getShimmyBinaryPath())
  }
})

ipcMain.handle('shimmy:logs', async () => {
  return shimmyServerLogs
})

ipcMain.handle('shimmy:clear-logs', async () => {
  shimmyServerLogs = []
  return { success: true }
})

// Chat handler
ipcMain.handle('shimmy:chat', async (event, request) => {
  try {
    // This would connect to the actual Shimmy server API
    // For now, return an error indicating server needs to be running
    if (!shimmyProcess) {
      return {
        error: 'Shimmy server is not running. Please start the server first.',
        message: null,
        usage: null
      }
    }

    // In a real implementation, this would make an HTTP request to the Shimmy server
    // For now, return a placeholder response
    return {
      message: {
        content: 'I apologize, but the chat functionality requires a running Shimmy server with a loaded model. Please ensure the server is started and a model is loaded.'
      },
      usage: {
        total_tokens: 0
      }
    }
  } catch (error) {
    console.error('Chat error:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      message: null,
      usage: null
    }
  }
})

// System information handlers
ipcMain.handle('system:info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node
  }
})

ipcMain.handle('system:getInfo', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node
  }
})

ipcMain.handle('system:getStats', async () => {
  const cpus = os.cpus()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()

  return {
    cpu: Math.round(((cpus.length * 100) - (freeMem / totalMem * 100)) / cpus.length),
    memory: Math.round(((totalMem - freeMem) / totalMem) * 100),
    disk: 50, // Placeholder - would need additional library for real disk usage
    network: 0, // Placeholder - would need additional library for network stats
    processes: 0 // Placeholder - would need additional library for process count
  }
})

// File system handlers
ipcMain.handle('fs:selectDirectory', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory']
  })
  return result
})

ipcMain.handle('fs:selectFile', async (event, filters) => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: filters || []
  })
  return result
})

// Terminal handlers
ipcMain.handle('terminal:create', async (event, options) => {
  try {
    const { command, cwd } = options

    return new Promise((resolve) => {
      const childProcess = spawn(command, [], {
        cwd: cwd || process.cwd(),
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let output = ''
      let errorOutput = ''

      childProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      childProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      childProcess.on('close', (code) => {
        resolve({
          output: output + errorOutput,
          exitCode: code || 0
        })
      })

      childProcess.on('error', (error) => {
        resolve({
          output: `Error: ${error.message}`,
          exitCode: 1
        })
      })
    })
  } catch (error) {
    return {
      output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      exitCode: 1
    }
  }
})

ipcMain.handle('terminal:write', async (event, sessionId, data) => {
  // Placeholder for terminal write functionality
  return { success: true }
})

ipcMain.handle('terminal:resize', async (event, sessionId, cols, rows) => {
  // Placeholder for terminal resize functionality
  return { success: true }
})

ipcMain.handle('terminal:kill', async (event, sessionId) => {
  // Placeholder for terminal kill functionality
  return { success: true }
})

// Database IPC handlers
ipcMain.handle('db:login', async (event, credentials) => {
  try {
    const result = await authService.login(credentials.username, credentials.password)
    return result
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
  }
})

ipcMain.handle('db:register', async (event, userData) => {
  try {
    const result = await authService.register(userData.username, userData.email, userData.password)
    return result
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
  }
})

ipcMain.handle('db:logout', async () => {
  try {
    await authService.logout()
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Logout failed' }
  }
})

// Initialize all services
async function initializeServices() {
  try {
    // Initialize database first
    await initializeDatabase()

    // Initialize services
    authService = new AuthService()
    shimmyServerService = new ShimmyServerService()
    loggingService = new LoggingService()
    knowledgeBaseService = new KnowledgeBaseService()
    terminalService = new SimpleTerminalService()

    console.log('All services initialized successfully')
  } catch (error) {
    console.error('Failed to initialize services:', error)
  }
}
