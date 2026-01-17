# 🚀 Quick Start Guide

## Tezkor O'rnatish

### 1. Paketlarni O'rnatish

```bash
npm run install:all
```

Yoki alohida:

```bash
# Backend
npm install

# Frontend  
cd client
npm install
cd ..
```

### 2. Ma'lumotlar Bazasini Sozlash

**PostgreSQL o'rnatish** (masalan, Windows uchun):
- https://www.postgresql.org/download/windows/ dan o'rnating
- Default port: 5432
- Parolni eslab qoling

**Baza yaratish:**
```sql
CREATE DATABASE codelive;
```

### 3. Redis O'rnatish

**Windows:**
- https://github.com/microsoftarchive/redis/releases dan o'rnating
- Yoki WSL2 ishlatishingiz mumkin

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. Environment Variables

`.env` faylini yarating (root papkada):

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3001

DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sizning_parolingiz
DB_DATABASE=codelive

REDIS_HOST=localhost
REDIS_PORT=6379

# Judge0 API - https://rapidapi.com/judge0-official/api/judge0-ce dan oling
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=sizning_api_key
```

### 5. Ishga Tushirish

**Ikki terminalda:**

Terminal 1 (Backend):
```bash
npm run start:dev
```

Terminal 2 (Frontend):
```bash
npm run client
```

**Yoki bitta komanda bilan:**
```bash
npm run dev:all
```

### 6. O'tish

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api

## ✅ Tekshirish

1. Saytga kirish: http://localhost:3001
2. "Create New Room" tugmasini bosing
3. Yangi xona yaratiladi va editorga o'tasiz
4. Kod yozing - real-time sinxronlanadi
5. "Run Code" tugmasini bosib kodni ishga tushiring

## 🐛 Muammolar

**Database connection error:**
- PostgreSQL ishlamoqda ekanligini tekshiring
- `.env` faylidagi ma'lumotlarni to'g'rilang

**Redis connection error:**
- Redis ishlamoqda ekanligini tekshiring: `redis-cli ping` (PONG qaytarishi kerak)

**Port already in use:**
- `.env` faylda `PORT=3000` ni `PORT=3002` ga o'zgartiring

## 📚 Qo'shimcha Ma'lumot

To'liq hujjatlar uchun `README.md` faylini o'qing.
