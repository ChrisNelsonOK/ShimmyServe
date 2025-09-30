# Getting Started with ShimmyServe

Welcome to ShimmyServe! This guide will help you get up and running with your new AI-powered desktop application.

## 📋 Prerequisites

Before installing ShimmyServe, ensure your system meets these requirements:

### System Requirements
- **Operating System**: 
  - macOS 10.15 (Catalina) or later
  - Windows 10 (version 1903) or later
  - Linux (Ubuntu 18.04+ or equivalent)
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 2GB free space for application, additional space for models
- **Network**: Internet connection for model downloads and updates

### Optional Components
- **Shimmy Server**: Can be bundled with ShimmyServe or run separately
- **CUDA GPU**: For accelerated model inference (NVIDIA GPUs)
- **Docker**: For containerized deployment

## 🚀 Installation

### Option 1: Download Pre-built Application

1. **Visit the releases page**
   - Go to [GitHub Releases](https://github.com/your-org/shimmy-serve/releases)
   - Download the latest version for your operating system

2. **Install the application**
   - **macOS**: Open the `.dmg` file and drag ShimmyServe to Applications
   - **Windows**: Run the `.exe` installer and follow the setup wizard
   - **Linux**: Install the `.AppImage` or `.deb` package

3. **Launch ShimmyServe**
   - Find ShimmyServe in your applications and launch it
   - The first-time setup wizard will guide you through configuration

### Option 2: Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/shimmy-serve.git
   cd shimmy-serve
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Package for your platform**
   ```bash
   npm run build:electron
   ```

## 🎯 First-Time Setup

When you first launch ShimmyServe, you'll be guided through a setup process:

### Step 1: Welcome Screen
- Review the welcome message and feature overview
- Click "Get Started" to begin setup

### Step 2: Server Configuration
Choose how to run your Shimmy server:

**Option A: Bundled Server (Recommended for beginners)**
- Select "Use bundled Shimmy server"
- The application will manage the server automatically
- Default port: 8080

**Option B: External Server**
- Select "Connect to external server"
- Enter server URL (e.g., `http://localhost:8080`)
- Test connection and proceed

### Step 3: Authentication Setup
- Create your admin account
- Set a strong password
- Configure security settings
- Enable two-factor authentication (optional)

### Step 4: Model Configuration
- Choose models to download and install
- Select from popular options:
  - **Llama 2 7B Chat** - General conversation
  - **Mistral 7B Instruct** - Instruction following
  - **CodeLlama 7B** - Code generation
- Wait for models to download (this may take time)

### Step 5: Final Configuration
- Review your settings
- Configure preferences (theme, notifications, etc.)
- Complete setup and launch the main interface

## 🏠 Main Interface Overview

After setup, you'll see the main ShimmyServe interface:

### Navigation Sidebar
- **Dashboard** - System overview and quick stats
- **Server Management** - Control Shimmy server and models
- **Chat** - AI conversation interface
- **Knowledge Base** - Document management and search
- **Terminal** - Built-in command line interface
- **Logs** - System logs and monitoring
- **Settings** - Application configuration
- **Users** - User management (admin only)

### Header Bar
- **System Status** - Server health indicator
- **User Menu** - Profile and logout options
- **Notifications** - System alerts and updates
- **Help** - Documentation and support

## 💬 Your First Chat

Let's start with a simple AI conversation:

1. **Navigate to Chat**
   - Click "Chat" in the sidebar
   - You'll see the chat interface with Shimmer AI

2. **Start a conversation**
   - Type a message in the input box at the bottom
   - Try: "Hello! Can you help me understand how Shimmy works?"
   - Press Enter or click the send button

3. **Explore features**
   - Try different types of questions
   - Ask for code examples
   - Request explanations of technical concepts

### Chat Features
- **Multiple Sessions** - Create separate conversations
- **Message History** - All conversations are saved
- **Code Highlighting** - Automatic syntax highlighting
- **Copy/Export** - Save conversations for later
- **RAG Integration** - AI can search your documents

## 📚 Adding Documents to Knowledge Base

Enhance your AI conversations with your own documents:

1. **Navigate to Knowledge Base**
   - Click "Knowledge Base" in the sidebar

2. **Upload documents**
   - Click "Upload Documents" or drag files to the upload area
   - Supported formats: PDF, TXT, MD, DOCX, HTML
   - Wait for processing and indexing

3. **Search and organize**
   - Use the search bar to find specific content
   - Add tags to organize documents
   - View document summaries and metadata

4. **Use in chat**
   - Enable RAG in chat settings
   - Ask questions about your documents
   - The AI will reference your content in responses

## 🖥️ Server Management

Monitor and control your Shimmy server:

### Server Status
- **Dashboard view** - Quick health check
- **Detailed metrics** - CPU, memory, network usage
- **Model status** - Loaded models and memory usage

### Model Management
- **Load/Unload models** - Manage active models
- **Model library** - Browse available models
- **Download new models** - Add models from repositories
- **Model settings** - Configure parameters and options

### Performance Monitoring
- **Real-time metrics** - Live system statistics
- **Historical data** - Performance trends over time
- **Alerts** - Notifications for issues
- **Optimization** - Automatic performance tuning

## 🔧 Basic Configuration

### User Preferences
1. **Go to Settings** - Click the gear icon in sidebar
2. **General tab** - Basic application settings
3. **Appearance** - Theme, font size, layout options
4. **Notifications** - Alert preferences
5. **Privacy** - Data collection and usage settings

### AI Settings
1. **Chat configuration** - Default model, temperature, tokens
2. **RAG settings** - Knowledge base integration options
3. **Model parameters** - Fine-tune AI behavior
4. **Response settings** - Output format and length

### Security Settings
1. **Password policy** - Strength requirements
2. **Session management** - Timeout and security
3. **API keys** - External service integration
4. **Audit logging** - Track user activities

## 🛠️ Terminal Usage

ShimmyServe includes a built-in terminal for advanced users:

1. **Open Terminal** - Click "Terminal" in sidebar
2. **Basic commands**:
   ```bash
   shimmy status          # Check server status
   shimmy models list     # List available models
   shimmy models load llama-2-7b-chat  # Load a model
   shimmy logs tail       # View recent logs
   ```

3. **Multiple sessions** - Create separate terminal sessions
4. **Command history** - Use arrow keys to navigate history
5. **Themes** - Customize terminal appearance

## 📊 Monitoring and Logs

Keep track of system health and activity:

### Log Viewer
- **Real-time logs** - Live log streaming
- **Filtering** - Filter by level, source, time
- **Search** - Find specific log entries
- **Export** - Save logs for analysis

### Analytics Dashboard
- **Usage statistics** - Request counts, response times
- **Performance metrics** - System resource usage
- **Error tracking** - Monitor and diagnose issues
- **Trends** - Historical performance data

## 🆘 Getting Help

If you need assistance:

### Built-in Help
- **Help menu** - Access documentation from the app
- **Tooltips** - Hover over elements for quick help
- **Status indicators** - Visual cues for system state

### Documentation
- **User Manual** - Comprehensive feature guide
- **FAQ** - Common questions and solutions
- **Video Tutorials** - Step-by-step walkthroughs

### Support Channels
- **GitHub Issues** - Report bugs and request features
- **Community Forum** - Ask questions and share tips
- **Email Support** - Direct assistance for complex issues

## 🎯 Next Steps

Now that you're set up, explore these advanced features:

1. **Customize your workspace** - Arrange panels and settings
2. **Create document collections** - Organize knowledge base
3. **Set up automation** - Use Shimmer AI agent for tasks
4. **Explore integrations** - Connect external services
5. **Join the community** - Share experiences and learn from others

## 🔄 Updating ShimmyServe

Keep your application current:

### Automatic Updates
- ShimmyServe checks for updates automatically
- You'll be notified when updates are available
- Updates can be installed with one click

### Manual Updates
- Download latest version from releases page
- Install over existing version (settings preserved)
- Restart application to complete update

### Beta Versions
- Join beta program for early access to features
- Enable beta updates in settings
- Provide feedback to help improve the software

---

**Congratulations!** You're now ready to use ShimmyServe. Explore the features, experiment with AI conversations, and make the most of your new AI-powered desktop application.

For more detailed information, check out the [User Manual](manual.md) or visit our [FAQ](faq.md) for common questions.
