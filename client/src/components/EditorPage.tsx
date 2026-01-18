import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import './EditorPage.css';

interface CodeResult {
  output: string;
  error: string | null;
  status: string;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'php', label: 'PHP' },
  { value: 'typescript', label: 'TypeScript' },
];

const EditorPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeUsers, setActiveUsers] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CodeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [userColors] = useState<{ [key: string]: string }>({});
  const editorRef = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Room link copied to clipboard!');
    });
  };

  const exportCode = () => {
    const fileExtension = language === 'javascript' ? 'js' : 
                         language === 'python' ? 'py' :
                         language === 'java' ? 'java' :
                         language === 'cpp' ? 'cpp' :
                         language === 'c' ? 'c' :
                         language === 'php' ? 'php' :
                         language === 'typescript' ? 'ts' : 'txt';
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Code exported successfully!');
  };

  const getUserColor = (id: string): string => {
    if (!userColors[id]) {
      const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];
      userColors[id] = colors[Object.keys(userColors).length % colors.length];
    }
    return userColors[id];
  };

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const socket = socketService.connect();
    socketRef.current = socket;

    // Join room
    socket.emit('join-room', { roomId });

    // Listen for initial code sync
    socket.on('sync-code', (data: { code: string; language: string }) => {
      setCode(data.code || '');
      setLanguage(data.language || 'javascript');
      setLoading(false);
    });

    // Listen for code updates from other users
    socket.on('code-updated', (data: { code: string; cursorPosition?: any }) => {
      if (data.code !== code) {
        setCode(data.code);
      }
    });

    // Listen for language changes
    socket.on('language-updated', (data: { language: string }) => {
      setLanguage(data.language);
    });

    // Listen for user join/leave
    socket.on('user-joined', (data: { activeUsers: number }) => {
      setActiveUsers(data.activeUsers);
    });

    socket.on('user-left', (data: { activeUsers: number }) => {
      setActiveUsers(data.activeUsers);
    });

    // Listen for code execution results
    socket.on('code-result', (data: CodeResult) => {
      setIsRunning(false);
      setResult(data);
    });

    socket.on('code-running', () => {
      setIsRunning(true);
      setResult(null);
    });

    socket.on('code-saved', () => {
      showToast('Code saved successfully!');
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    // Fetch room details if socket doesn't provide code immediately
    api.getRoom(roomId)
      .then((response) => {
        if (!code && response.data.code) {
          setCode(response.data.code);
        }
        if (response.data.language) {
          setLanguage(response.data.language);
        }
        setActiveUsers(response.data.activeUsers);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load room');
        setLoading(false);
      });

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      socket.emit('leave-room', { roomId });
      socketService.disconnect();
    };
  }, [roomId, navigate]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);

    // Debounce socket emit
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && roomId) {
        socketRef.current.emit('code-change', {
          roomId,
          code: newCode,
        });
      }
    }, 300);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (socketRef.current && roomId) {
      socketRef.current.emit('language-change', {
        roomId,
        language: newLanguage,
      });
    }
  };

  const handleRunCode = () => {
    if (!socketRef.current || !roomId) return;

    setIsRunning(true);
    setResult(null);

    socketRef.current.emit('run-code', {
      roomId,
      code,
      language,
    });
  };

  const handleSaveCode = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('save-code', {
        roomId,
        code,
      });
    }
  };

  const getMonacoLanguage = (lang: string) => {
    const langMap: { [key: string]: string } = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      php: 'php',
    };
    return langMap[lang] || 'javascript';
  };

  if (loading) {
    return (
      <div className="editor-page loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-page error">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <div className="editor-header">
        <div className="editor-header-left">
          <button className="btn-icon" onClick={() => navigate('/')}>
            ← Back
          </button>
          <div className="room-info">
            <span className="room-id">Room: {roomId}</span>
            <span className="active-users">👥 {activeUsers} active</span>
          </div>
        </div>

        <div className="editor-header-center">
          <select
            className="language-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="editor-header-right">
          <button className="btn btn-icon" onClick={copyRoomLink} title="Copy room link">
            🔗
          </button>
          <button className="btn btn-icon" onClick={exportCode} title="Export code">
            📥
          </button>
          <button className="btn btn-secondary" onClick={handleSaveCode}>
            💾 Save
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Running...' : '▶️ Run Code'}
          </button>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-wrapper">
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>

        {result && (
          <div className="result-panel">
            <div className="result-header">
              <h3>Output</h3>
              <button
                className="btn-close"
                onClick={() => setResult(null)}
              >
                ×
              </button>
            </div>
            <div className="result-content">
              {result.error ? (
                <div className="result-error">
                  <strong>Error:</strong>
                  <pre>{result.error}</pre>
                </div>
              ) : (
                <div className="result-output">
                  <strong>Output:</strong>
                  <pre>{result.output || '(No output)'}</pre>
                </div>
              )}
              <div className="result-status">
                Status: {result.status}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default EditorPage;
