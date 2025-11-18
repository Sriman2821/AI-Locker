# AI-Locker

A comprehensive learning management system for organizing tools, materials, and source code with AI-powered features.

## 🚀 Quick Deploy

### Deploy to Production

[![Deploy Frontend to Vercel](https://vercel.com/button)](https://vercel.com/new/clone)
[![Deploy Backend to Railway](https://railway.app/button.svg)](https://railway.app/new)

**📖 Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 🏗️ Project Structure

```
AI-Locker/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── Components/  # React components
│   │   ├── Pages/       # Page components
│   │   ├── api/         # API clients
│   │   └── contexts/    # React contexts
│   ├── .env.example     # Environment variables template
│   └── package.json
│
├── server/              # Express backend
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB models
│   ├── middleware/      # Auth & other middleware
│   ├── uploads/         # User-uploaded files
│   ├── .env.example     # Environment variables template
│   ├── railway.json     # Railway deployment config
│   └── package.json
│
├── DEPLOYMENT.md        # Detailed deployment guide
└── vercel.json          # Vercel deployment config
```

---

## 💻 Local Development

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd AI-Locker
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Configure environment variables**

   **Client** (`client/.env`):
   ```bash
   VITE_API_URL=http://localhost:5010
   ```

   **Server** (`server/.env`):
   ```bash
   MONGO_URI=mongodb://localhost:27017/ai_locker
   PORT=5010
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   JWT_SECRET=your_local_dev_secret_key_min_32_chars
   ADMIN_EMAIL=admin@gmail.com
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=Admin
   ```

4. **Start development servers**
   ```bash
   # From project root
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5010

5. **Login with admin credentials**
   - Email: `admin@gmail.com`
   - Password: `admin123` (or whatever you set in .env)

---

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:5010/api/health
```

### Frontend Build
```bash
cd client
npm run build
npm run preview
```

---

## 📦 Features

- 🔐 **Authentication**: Secure JWT-based auth with role management
- 📚 **Learning Materials**: Organize and manage educational content
- 🛠️ **Tools Management**: Categorize and track development tools
- 💻 **Source Code Library**: Store and access code snippets
- 📤 **File Uploads**: Support for various file types
- 🎨 **Modern UI**: Built with React, Tailwind CSS, and Radix UI
- 📱 **Responsive Design**: Works on all device sizes

---

## 🔧 Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **React Router** - Navigation
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads

---

## 🌐 Deployment

This application is designed to be deployed with:
- **Frontend**: Vercel (recommended)
- **Backend**: Railway (recommended)
- **Database**: MongoDB Atlas

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

---

## 📝 Environment Variables

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com` |

### Backend (Railway)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | ✅ |
| `PORT` | Server port | ✅ |
| `NODE_ENV` | Environment mode | ✅ |
| `CORS_ORIGIN` | Allowed frontend origins | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `ADMIN_EMAIL` | Default admin email | ✅ |
| `ADMIN_PASSWORD` | Default admin password | ✅ |
| `ADMIN_NAME` | Default admin name | ✅ |
| `MAX_UPLOAD_SIZE` | Max file size in bytes | ❌ |

---

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Role-based access control

**⚠️ Important**: Change default admin credentials after first deployment!

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 🆘 Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section.

For development questions, check the code comments or create an issue.

---

## 🎯 Roadmap

- [ ] Cloud storage integration (AWS S3/Cloudinary)
- [ ] Email notifications
- [ ] Advanced search functionality
- [ ] Export/Import features
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests

---

Made with ❤️ using React, Node.js, and MongoDB
