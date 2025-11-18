# 🚀 Quick Render Deployment Reference

## Before You Start
- [ ] MongoDB Atlas cluster created
- [ ] GitHub repository ready
- [ ] Vercel account created
- [ ] Render account created

---

## 📝 Environment Variables

### Render (Backend)
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai_locker
PORT=10000
CORS_ORIGIN=https://your-vercel-app.vercel.app,https://your-app-*.vercel.app
JWT_SECRET=<generate-32-char-random-string>
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=<change-this-password>
ADMIN_NAME=Admin
MAX_UPLOAD_SIZE=10485760
```

### Vercel (Frontend)
```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## ⚡ Deployment Steps

### 1️⃣ Deploy Backend to Render
1. Login to Render.com
2. New + → Web Service
3. Connect GitHub repo
4. Configure:
   - **Name**: ai-locker-backend
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add environment variables (from above)
6. Create Web Service
7. Copy URL: `https://your-backend.onrender.com`
8. Test: `https://your-backend.onrender.com/api/health`

### 2️⃣ Deploy Frontend to Vercel
1. Login to Vercel.com
2. Import GitHub repository
3. Configure:
   - **Framework**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy
6. Copy Vercel URL

### 3️⃣ Update CORS on Render
1. Go to Render → Environment
2. Update `CORS_ORIGIN` with Vercel URL
3. Save (auto-redeploys)

---

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS Error | Update `CORS_ORIGIN` with exact Vercel URL |
| Slow first load | Free tier sleeps (30s wake time) |
| API Not Found | Check `VITE_API_URL` in Vercel |
| Database Error | Check MongoDB URI and IP whitelist (0.0.0.0/0) |
| Uploads disappear | Render has ephemeral storage - use S3/Cloudinary |

---

## 📊 Service URLs

- **Frontend (Vercel)**: https://_____________________.vercel.app
- **Backend (Render)**: https://_____________________.onrender.com
- **Database (MongoDB)**: mongodb+srv://_____________________.mongodb.net

---

## 🔐 Security Checklist

- [ ] Changed default admin password
- [ ] Generated secure JWT_SECRET (32+ chars)
- [ ] MongoDB IP whitelist configured
- [ ] CORS origin correctly set
- [ ] No `.env` files in GitHub

---

## 💡 Helpful Commands

### Test Backend
```bash
curl https://your-backend.onrender.com/api/health
```

### View Logs
- **Render**: Service → Logs tab
- **Vercel**: Deployments → Latest → Logs

---

**Full Guide**: [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md)
