## 📦 Messenger Back-End

A RESTful API server built with Node.js and Express.js to support real-time messaging operations.

### 🚀 Features

* User authentication with JWT
* Secure password storage using bcrypt
* CRUD operations for users and messages
* Real-time chat support via WebSocket (Socket.IO)
* MongoDB database integration using Mongoose ORM
* Input validation with [Joi](https://github.com/sideway/joi)
* Error handling and structured logging

### ⚙️ Tech Stack

| Layer          | Technology           |
| -------------- | -------------------- |
| Runtime        | Node.js (ES Modules) |
| Framework      | Express.js           |
| Database       | MongoDB (Mongoose)   |
| Authentication | JWT + bcrypt         |
| Socket Library | Socket.IO            |
| Validation     | Joi                  |

### 🧩 Installation & Setup

```bash
git clone https://github.com/naderianaliakbar/Messenger-Back-End.git
cd Messenger-Back-End
npm install
```

Copy `.env.example` to `.env` and configure:

```dotenv
PORT=5000
MONGODB_URI=mongodb://localhost:27017/messenger-db
JWT_SECRET=your_jwt_secret
```

### 🏁 Running the Server

```bash
npm run dev     # Run in development mode with nodemon
npm start       # Run in production mode
```

API will be available at `http://localhost:5000`.

### 🛠️ API Endpoints

* **Auth**

  * `POST /api/auth/register` – Register new user
  * `POST /api/auth/login` – Login and receive JWT
* **Users** *(protected)*

  * `GET /api/users` – List all users
  * `GET /api/users/:id` – Get user by ID
* **Messages** *(protected)*

  * `GET /api/messages/:chatId` – List messages in a chat
  * `POST /api/messages` – Send a new message

Real-time WebSocket events (via Socket.IO):

* `connection`, `disconnect` – socket lifecycle
* `message`, `typing`, `read` – chat events

### 🧪 Testing

Include Jest or Mocha/Chai setup if you plan to add unit/integration tests. Example:

```bash
npm test
```

### 📘 Project Structure

```
src/
├── controllers/
├── models/
├── routes/
├── services/
├── middlewares/
├── utils/
└── index.js
```

### 💡 Usage Tips

* Always include `Authorization: Bearer <JWT>` header when using protected routes
* Use WS or Socket.IO clients for real-time message handling

### 🤝 Contribution

Fork the repo, create feature branches, and submit PRs. Please follow best practices for code quality and testing.

### 📄 License

This project is licensed under the MIT License.
