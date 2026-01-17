# CodeLive Client

React-based frontend for CodeLive - Real-time Collaborative Code Editor.

## Features

- Real-time code synchronization using Socket.io
- Monaco Editor (VS Code editor)
- Multi-language support
- Code execution with live output
- Room-based collaboration
- Beautiful, responsive UI

## Running

```bash
npm start
```

The app will open at http://localhost:3001

## Environment Variables

Create a `.env` file:

```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SOCKET_URL=http://localhost:3000
```
