# CodeLive - Real-time Collaborative Code Editor

Professional real-time collaborative code editing platform built with **NestJS**, **TypeORM**, **Socket.io**, and **React**.

## ✨ Features

- 🔄 **Real-time Code Synchronization** - Code changes sync instantly across all connected users
- 🚪 **Room-based Collaboration** - Create or join rooms for collaborative coding sessions
- 📝 **Multi-language Support** - JavaScript, Python, Java, C++, C, PHP, TypeScript, and more
- ▶️ **Code Execution** - Execute code directly in the editor using Judge0 API
- 💾 **Auto-save & Caching** - Redis caching for fast access + PostgreSQL persistence
- 👥 **Active User Tracking** - See how many users are in the room
- 🎨 **Monaco Editor** - Beautiful VS Code-like editor experience
- 🔒 **Secure & Validated** - Built with TypeScript, validation, and error handling
- 🚀 **Production Ready** - Optimized with debouncing, compression, and security headers

## 🛠 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework with TypeScript
- **TypeORM** - Object-Relational Mapping for database operations
- **PostgreSQL/MySQL** - Primary database for persistence
- **Redis** - Real-time caching and session management
- **Socket.io** - WebSocket communication for real-time updates
- **TypeScript** - Type-safe development

### Frontend
- **React 18** - Modern UI framework
- **Monaco Editor** - VS Code's code editor engine
- **Socket.io Client** - Real-time bidirectional communication
- **TypeScript** - Full type safety
- **React Router** - Client-side routing

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL or MySQL database
- Redis server
- npm or yarn

## 🚀 Installation

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Or use the convenience script:

```bash
npm run install:all
```

### 2. Setup Database

Make sure PostgreSQL (or MySQL) is running and create a database:

```sql
CREATE DATABASE codelive;
```

### 3. Setup Redis

Install and start Redis:

```bash
# On macOS
brew install redis
brew services start redis

# On Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# On Windows
# Download from https://redis.io/download
```

### 4. Configure Environment Variables

Copy `env.example` to `.env` and update the values:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3001

DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=codelive

REDIS_HOST=localhost
REDIS_PORT=6379

# Get your Judge0 API key from: https://rapidapi.com/judge0-official/api/judge0-ce
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_api_key_here
```

### 5. Run Database Migrations (if needed)

TypeORM will auto-sync in development mode. For production, use migrations:

```bash
npm run migration:generate -- -n InitialMigration
npm run migration:run
```

## 🎯 Running the Application

### Development Mode

**Option 1: Run backend and frontend together**
```bash
npm run dev:all
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
npm run start:dev
```

Terminal 2 (Frontend):
```bash
npm run client
```

The application will be available at:
- **Backend API**: http://localhost:3000/api
- **Frontend**: http://localhost:3001

### Production Build

```bash
# Build backend
npm run build

# Build frontend
cd client
npm run build
cd ..

# Run production server
npm run start:prod
```

## 📡 API Documentation

### REST Endpoints

#### Rooms

- **Create Room**
  ```
  POST /api/rooms
  Body: { "language": "javascript", "initialCode": "console.log('Hello');" }
  Response: { "success": true, "data": { "roomId": "...", "language": "javascript" } }
  ```

- **Get Room**
  ```
  GET /api/rooms/:id
  Response: { "success": true, "data": { "roomId": "...", "code": "...", "activeUsers": 2 } }
  ```

- **Delete Room**
  ```
  DELETE /api/rooms/:id
  Response: 204 No Content
  ```

### WebSocket Events

#### Client → Server

- **join-room** - Join a room
  ```json
  { "roomId": "abc-123", "userId": "user-1" }
  ```

- **code-change** - Send code changes
  ```json
  { "roomId": "abc-123", "code": "console.log('Hello');", "cursorPosition": { "line": 1, "column": 10 } }
  ```

- **language-change** - Change programming language
  ```json
  { "roomId": "abc-123", "language": "python" }
  ```

- **run-code** - Execute code
  ```json
  { "roomId": "abc-123", "code": "print('Hello')", "language": "python", "stdin": "" }
  ```

- **save-code** - Manually save code to database
  ```json
  { "roomId": "abc-123", "code": "..." }
  ```

- **leave-room** - Leave a room
  ```json
  { "roomId": "abc-123" }
  ```

#### Server → Client

- **sync-code** - Initial code synchronization when joining
- **code-updated** - Code changes from other users
- **language-updated** - Language change notifications
- **user-joined** - User joined the room
- **user-left** - User left the room
- **code-result** - Code execution results
- **code-running** - Code execution started
- **code-saved** - Code saved confirmation
- **error** - Error messages

## 📁 Project Structure

```
codelive/
├── src/
│   ├── config/                 # Configuration files
│   │   └── database.config.ts  # Database and Redis config
│   ├── modules/                # Feature modules
│   │   ├── rooms/              # Room management
│   │   │   ├── entities/       # TypeORM entities
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   ├── rooms.controller.ts
│   │   │   ├── rooms.service.ts
│   │   │   └── rooms.module.ts
│   │   ├── code/               # Code execution service
│   │   │   ├── code.service.ts
│   │   │   └── code.module.ts
│   │   ├── websocket/          # WebSocket gateway
│   │   │   ├── websocket.gateway.ts
│   │   │   └── websocket.module.ts
│   │   └── redis/              # Redis service
│   │       ├── redis.service.ts
│   │       └── redis.module.ts
│   ├── common/                 # Shared utilities
│   │   ├── filters/            # Exception filters
│   │   ├── interceptors/       # Response interceptors
│   │   ├── decorators/         # Custom decorators
│   │   └── dto/                # Common DTOs
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Application entry point
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── HomePage.tsx
│   │   │   └── EditorPage.tsx
│   │   ├── services/           # API and Socket services
│   │   └── App.tsx
│   └── package.json
├── dist/                       # Compiled output (generated)
├── .env                        # Environment variables (create from env.example)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Supported Programming Languages

The platform supports the following languages (via Judge0):

- JavaScript (63)
- Python (71)
- Java (62)
- C++ (54)
- C (50)
- PHP (68)
- TypeScript (74)
- Ruby (72)
- Go (60)
- Rust (73)
- Kotlin (78)
- Swift (83)

## 🐛 Troubleshooting

### Database Connection Issues

Ensure your database is running and credentials are correct in `.env`:
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d codelive
```

### Redis Connection Issues

Test Redis connection:
```bash
redis-cli ping
# Should return: PONG
```

### Port Already in Use

Change the port in `.env`:
```env
PORT=3000  # Change to 3001, 3002, etc.
```

### Judge0 API Issues

If code execution fails, verify your API key at [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Socket.io](https://socket.io/) - Real-time communication
- [Judge0](https://judge0.com/) - Code execution API

---

**Made with ❤️ using NestJS and React**
