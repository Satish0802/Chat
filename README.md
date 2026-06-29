# Chatwave

A real-time full-stack chat application built with the MERN stack and Socket.IO. Supports group channels, direct messages, live typing indicators, online presence, user avatars, file sharing, read receipts, message search, unread notifications, channel membership, and user discovery — with a clean dark-sidebar UI.

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
- **Group channels** — join named rooms like `#general` or `#dev-talk`; new users auto-join `#general` only
- **Channel membership** — channels are stored in MongoDB with a members list; users browse and join public channels via the sidebar
- **Direct messages** — private 1-to-1 conversations; only previously messaged users appear in sidebar
- **User discovery** — search for any user by username to start a new DM conversation
- **Typing indicators** — live "Alex is typing..." with debounce
- **Online presence** — green dot shows who's currently connected
- **User avatars & profiles** — upload and display profile pictures via Cloudinary; dedicated profile page
- **File & image sharing** — send images and attachments via Cloudinary with Multer upload handling
- **Read receipts** — double tick per message; grey when delivered, blue when read by the recipient; tracked via IntersectionObserver and persisted in MongoDB
- **Message search** — keyword search in the current room with highlighted matches
- **Notification bell** — unread badge count per room; bell dropdown lists all rooms with unread messages and navigates on click
- **Shared media panel** — view all images and files ever sent in any room or DM, accessible from the top bar
- **Last room persistence** — app reopens to the last active room on next login via localStorage
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
│       │   ├── Sidebar.jsx       # Channels, DMs, user search, unread badges
│       │   ├── TopBar.jsx        # Search, members/media panel, notification bell
│       │   ├── ChatWindow.jsx    # Message feed with date separators and read tracking
│       │   ├── MessageBubble.jsx # Individual message row with read status indicator
│       │   └── MessageInput.jsx  # Textarea with send + typing emit
│       ├── pages/
│       │   ├── ChatPage.jsx      # Main layout, wires all components, last-room memory
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
    │   ├── Message.js            # sender, room, content, type, readBy, fileUrl
    │   └── Room.js               # name, type, isPrivate, createdBy, members[]
    ├── routes/
    │   ├── auth.js               # register, login, user search, DM user list
    │   ├── messages.js           # GET /api/messages/:room
    │   ├── rooms.js              # GET/POST rooms, join, leave, members
    │   └── upload.js             # POST /api/upload — Cloudinary image/file upload
    ├── middleware/
    │   ├── auth.js               # JWT protect middleware
    │   └── upload.js             # Multer + Cloudinary storage config
    ├── socket/
    │   └── index.js              # Socket.IO init, rooms:join-all, message:read
    ├── SeedRooms.js              # One-time script to create default channels in DB
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

Seed default channels (run once):

```bash
node SeedRooms.js
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
| Client → Server | `rooms:join-all` | _(none)_ |
| Client → Server | `room:join` | `{ roomId }` |
| Client → Server | `message:send` | `{ roomId, content }` |
| Client → Server | `message:read` | `{ messageId }` |
| Client → Server | `typing:start` | `{ roomId }` |
| Client → Server | `typing:stop` | `{ roomId }` |
| Server → Client | `message:receive` | Message document (populated) |
| Server → Client | `message:read` | `{ messageId, readBy }` |
| Server → Client | `typing:start` | `{ userId, username, roomId }` |
| Server → Client | `typing:stop` | `{ userId, username, roomId }` |
| Server → Client | `user:online` | `userId` |
| Server → Client | `user:offline` | `userId` |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (auto-joins #general) |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/users?search=` | Search users by username |
| GET | `/api/auth/dm-users` | Get users current user has DM history with |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages/:room` | Fetch messages for a room |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | Get all channels |
| POST | `/api/rooms` | Create a new channel |
| POST | `/api/rooms/:id/join` | Join a public channel |
| POST | `/api/rooms/:id/leave` | Leave a channel |
| GET | `/api/rooms/:id/members` | Get channel members |

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

- [x] Read receipts (double tick per message)
- [x] Message search with keyword highlighting
- [x] Unread message count per room
- [x] Notification bell with room navigation
- [x] Shared media & files panel
- [x] Channel membership (join/leave, DB-backed)
- [x] User discovery via search to start DMs
- [x] Last active room persistence
- [ ] Kick/remove members from channels
- [x] Block users in DM
- [ ] Emoji reactions
- [ ] AI slash command (`/summarize` — summarizes last 20 messages using sny free API)

---

## Author

**Satish Shrestha (Satoki)**
GitHub: [@Satish0802](https://github.com/Satish0802)