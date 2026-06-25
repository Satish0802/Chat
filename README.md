# Chatwave

A real-time full-stack chat application built with the MERN stack and Socket.IO. Supports group channels, direct messages, live typing indicators, online presence, user avatars, and file sharing — with a clean dark-sidebar UI.

**Live demo:** _coming soon_

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v3, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Storage | Cloudinary, Multer |
| Deployment | Vercel (client), Render (server) |

---

## Features

- **Real-time messaging** — messages appear instantly across all connected clients via WebSocket
- **Group channels** — join named rooms like `#general` or `#dev-talk`
- **Direct messages** — private 1-to-1 conversations
- **Typing indicators** — live "Alex is typing..." with debounce
- **Online presence** — green dot shows who's currently connected
- **User avatars & profiles** — upload and display profile pictures via Cloudinary; dedicated profile page
- **File & image sharing** — send images and attachments via Cloudinary with Multer upload handling
- **Message clustering** — consecutive messages from the same sender group together (no repeated avatars)
- **Date separators** — automatic Today / Yesterday / date labels between message groups
- **JWT authentication** — register, login, protected routes and socket connections
- **Auto-scroll** — chat window scrolls to the latest message automatically

---

## Project structure

```
chatwave/
├── client/                   # React frontend (Vite)
│   ├── public/
│   └── src/
│       ├── assets/
│       │   └── hero.png
│       ├── components/
│       │   ├── Sidebar.jsx       # Channel list, DMs, user footer
│       │   ├── TopBar.jsx        # Room header and action buttons
│       │   ├── ChatWindow.jsx    # Message feed with date separators
│       │   ├── MessageBubble.jsx # Individual message row
│       │   └── MessageInput.jsx  # Textarea with send + typing emit
│       ├── pages/
│       │   ├── ChatPage.jsx      # Main layout, wires all components
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   └── ProfilePage.jsx   # User profile & avatar management
│       ├── hooks/
│       │   └── useSocket.js      # Socket.IO connection + event handlers
│       ├── context/
│       │   └── AuthContext.jsx   # JWT token + user state
│       └── lib/
│           └── api.js            # Axios instance with auth header
│
└── server/                   # Express backend
    ├── models/
    │   ├── User.js               # username, email, password (hashed), avatar, isOnline
    │   └── Message.js            # sender, room, content, type, readBy, fileUrl
    ├── routes/
    │   ├── auth.js               # POST /api/auth/register, /login
    │   ├── messages.js           # GET /api/messages/:room
    │   └── upload.js             # POST /api/upload — Cloudinary image/file upload
    ├── middleware/
    │   ├── auth.js               # JWT protect middleware
    │   └── upload.js             # Multer + Cloudinary storage config
    ├── socket/
    │   └── index.js              # Socket.IO init, event handlers
    └── index.js                  # Entry point, Express + HTTP server
```

---

## Getting started

### Prerequisites

- Node.js v18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account and cluster
- A [Cloudinary](https://cloudinary.com) account (for avatar & file uploads)

### 1. Clone the repo

```bash
git clone https://github.com/Satish0802/chatwave.git
cd chatwave
```

### 2. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/chatwave
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
PORT=8080

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the server:

```bash
npm run dev
```

Server runs on `http://localhost:8080`

### 3. Set up the client

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_SERVER_URL=http://localhost:8080
```

Start the client:

```bash
npm run dev
```

Client runs on `http://localhost:5173`

### 4. Run both at once (optional)

From the project root:

```bash
npm install -D concurrently
```

Add to root `package.json`:

```json
"scripts": {
  "dev": "concurrently \"cd server && npm run dev\" \"cd client && npm run dev\""
}
```

Then just:

```bash
npm run dev
```

---

## Environment variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `CLIENT_URL` | Frontend URL for CORS (use Vercel URL in production) |
| `PORT` | Port to run the server on (default: 8080) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_SERVER_URL` | Backend URL for API and Socket.IO connection |

---

## Socket.IO events

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `room:join` | `{ roomId }` |
| Client → Server | `message:send` | `{ roomId, content }` |
| Client → Server | `typing:start` | `{ roomId }` |
| Client → Server | `typing:stop` | `{ roomId }` |
| Server → Client | `message:receive` | Message document (populated) |
| Server → Client | `typing:start` | `{ userId, roomId }` |
| Server → Client | `typing:stop` | `{ userId, roomId }` |
| Server → Client | `user:online` | `userId` |
| Server → Client | `user:offline` | `userId` |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages/:room` | Fetch messages for a room |

### Upload
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload image/file to Cloudinary (multipart/form-data) |

---

## Deployment

### Client → Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com), set root directory to `client`
3. Add environment variable: `VITE_SERVER_URL=https://your-server.onrender.com`
4. Deploy — Vercel detects Vite automatically

### Server → Render

1. Create a new Web Service in [Render](https://render.com), root directory `server`
2. Build command: `npm install` · Start command: `node index.js`
3. Add all variables from `server/.env` in the Render dashboard
4. Set `CLIENT_URL` to your Vercel deployment URL

> **Note:** Render's free tier spins down after 15 minutes of inactivity. Socket.IO has built-in reconnection logic so clients reconnect automatically on cold start.

---

## Roadmap

- [ ] Read receipts (double tick per message)
- [ ] Emoji reactions
- [ ] Unread message count per room
- [ ] Message search
- [ ] AI slash command (`/summarize` — summarizes last 20 messages using Claude API)

---

## Author

**Satish Shrestha (Satoki)**
GitHub: [@Satish0802](https://github.com/Satish0802)
