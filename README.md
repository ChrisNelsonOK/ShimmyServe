# ShimmyServe

**Next-generation cross-platform GUI for Shimmy AI inferencing server**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

ShimmyServe is a comprehensive, professional-grade desktop application that provides a modern graphical interface for managing and interacting with the [Shimmy](https://github.com/Michael-A-Kuykendall/shimmy) LLM inference server. Built with Electron, React, and TypeScript, it offers enterprise-level features including AI-powered chat, knowledge base management, system monitoring, and advanced automation.

## ✨ Features

### 🚀 **Core Functionality**
- **Server Management** - Complete lifecycle management of Shimmy servers
- **Model Management** - Load, unload, and configure AI models with hot-swapping
- **Real-time Monitoring** - System metrics, performance analytics, and health checks
- **Configuration Management** - Centralized settings with import/export capabilities

### 🤖 **AI-Powered Interface**
- **Chat Interface** - Interactive conversations with AI models
- **Shimmer AI Agent** - Intelligent system assistant with automation capabilities
- **Knowledge Base** - Document management with vector search and RAG integration
- **Code Generation** - AI-assisted code creation and debugging

### 🛠️ **Professional Tools**
- **Terminal Console** - Built-in terminal with command history and themes
- **Logging Interface** - Advanced log viewing, filtering, and analytics
- **User Management** - Role-based access control with admin panel
- **Settings Panel** - Comprehensive configuration with security controls

### 🔧 **Advanced Features**
- **Cross-platform** - Native desktop app for macOS, Windows, and Linux
- **Dark Theme** - Modern, professional dark interface
- **Real-time Updates** - Live streaming of logs, metrics, and system status
- **Export/Import** - Backup and restore configurations, sessions, and data
- **Performance Optimization** - Efficient resource usage and caching

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Shimmy Server** (optional - can be bundled or external)
- **Operating System**: macOS 10.15+, Windows 10+, or Linux (Ubuntu 18.04+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/shimmy-serve.git
   cd shimmy-serve
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### First Run

1. **Launch ShimmyServe** - The application will start with a setup wizard
2. **Configure Shimmy Server** - Connect to existing server or start bundled instance
3. **Set up Authentication** - Create admin account and configure security
4. **Load Models** - Download or configure AI models for inference
5. **Start Chatting** - Begin interacting with your AI models

## 📖 Documentation

### User Guides
- [Getting Started Guide](docs/user/getting-started.md) - Complete setup and first steps
- [User Manual](docs/user/manual.md) - Comprehensive feature documentation
- [FAQ & Troubleshooting](docs/user/faq.md) - Common issues and solutions

### Developer Documentation
- [Architecture Overview](docs/developer/architecture.md) - System design and components
- [API Documentation](docs/developer/api.md) - Internal APIs and interfaces
- [Contributing Guide](docs/developer/contributing.md) - Development workflow and standards
- [Testing Guide](TESTING.md) - Test setup, writing, and best practices

### Deployment
- [Installation Guide](docs/deployment/installation.md) - Production deployment
- [Configuration Reference](docs/deployment/configuration.md) - All settings and options
- [Docker Deployment](docs/deployment/docker.md) - Containerized deployment

## 🏗️ Architecture

ShimmyServe is built with a modern, scalable architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                    │
├─────────────────────────────────────────────────────────────┤
│                   React Renderer Process                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Components    │  │     Stores      │  │    Hooks     │ │
│  │                 │  │                 │  │              │ │
│  │ • Dashboard     │  │ • Auth Store    │  │ • useSystem  │ │
│  │ • Chat          │  │ • Chat Store    │  │ • useConfig  │ │
│  │ • Terminal      │  │ • System Store  │  │ • useModels  │ │
│  │ • Settings      │  │ • Logging Store │  │ • useLogs    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   API Client    │  │   Database      │  │   File I/O   │ │
│  │                 │  │                 │  │              │ │
│  │ • Shimmy API    │  │ • SQLite        │  │ • Config     │ │
│  │ • REST Client   │  │ • Drizzle ORM   │  │ • Logs       │ │
│  │ • WebSocket     │  │ • Migrations    │  │ • Models     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Desktop**: Electron 27, Node.js 18+
- **State Management**: Zustand with persistence
- **Database**: SQLite with Drizzle ORM
- **Build Tools**: Vite, ESBuild, Electron Builder
- **Testing**: Vitest, Testing Library, Playwright

## 🛠️ Development

### Project Structure

```
shimmy-serve/
├── src/
│   ├── components/          # React components
│   ├── stores/             # Zustand state stores
│   ├── lib/                # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   └── test/               # Testing utilities
├── electron/               # Electron main process
├── docs/                   # Documentation
├── public/                 # Static assets
└── dist/                   # Build output
```

### Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Run tests**
   ```bash
   npm run test
   ```

3. **Build application**
   ```bash
   npm run build
   ```

4. **Package for distribution**
   ```bash
   npm run build:electron
   ```

### Code Quality

- **ESLint** - Code linting and style enforcement
- **TypeScript** - Static type checking
- **Prettier** - Code formatting
- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/developer/contributing.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Write comprehensive tests
- Document new features
- Follow conventional commit messages
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Shimmy](https://github.com/Michael-A-Kuykendall/shimmy) - The powerful LLM inference server
- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/shimmy-serve/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/shimmy-serve/discussions)
- **Email**: support@shimmyserve.com

## 🗺️ Roadmap

### Current Version (1.0.0)
- ✅ Complete GUI interface
- ✅ AI chat and knowledge base
- ✅ System monitoring and management
- ✅ Cross-platform desktop app

### Future Releases
- 🔄 **v1.1** - Plugin system and extensions
- 🔄 **v1.2** - Advanced model fine-tuning
- 🔄 **v1.3** - Multi-server management
- 🔄 **v1.4** - Cloud deployment integration

---

**Built with ❤️ by the ShimmyServe Team**
