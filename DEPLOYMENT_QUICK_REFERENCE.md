# 🚀 Quick Deployment Reference

## Before You Start
- [ ] MongoDB Atlas cluster created
- [ ] GitHub repository ready
- [ ] Vercel account created
- [ ] Railway account created

---

## 📝 Environment Variables Checklist

### Railway (Backend)
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai_locker
PORT=5010
CORS_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=<generate-32-char-random-string>
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=<change-this-password>
ADMIN_NAME=Admin
MAX_UPLOAD_SIZE=10485760
```

### Vercel (Frontend)
```bash
VITE_API_URL=https://your-railway-backend.up.railway.app
```

---

## ⚡ Deployment Steps

### 1️⃣ Deploy Backend First (Railway)
1. Login to Railway.app
2. New Project → Deploy from GitHub
3. Set Root Directory: `server`
4. Add environment variables above
5. Generate domain → Copy URL
6. Test: `https://your-backend.up.railway.app/api/health`

### 2️⃣ Deploy Frontend (Vercel)
1. Login to Vercel.com
2. Import GitHub repository
3. Framework: Vite
4. Add environment variable: `VITE_API_URL`
5. Deploy → Copy Vercel URL

### 3️⃣ Update CORS (Railway)
1. Go back to Railway
2. Update `CORS_ORIGIN` with Vercel URL
3. Wait for auto-redeploy

### 4️⃣ Test Everything
- Visit Vercel URL
- Login with admin credentials
- Check browser console (no CORS errors)
- Test create/read/update/delete operations

---

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS Error | Update `CORS_ORIGIN` in Railway with exact Vercel URL |
| API Not Found | Check `VITE_API_URL` in Vercel matches Railway domain |
| Database Error | Verify MongoDB URI and IP whitelist (0.0.0.0/0) |
| Login Failed | Check Railway logs for admin seed status |
| Upload Failed | Check `MAX_UPLOAD_SIZE` and Railway logs |

---

## 📊 Service URLs

After deployment, save these:

- **Frontend (Vercel)**: https://_____________________.vercel.app
- **Backend (Railway)**: https://_____________________.up.railway.app
- **Database (MongoDB)**: mongodb+srv://_____________________.mongodb.net

---

## 🔐 Security Checklist

- [ ] Changed default admin password
- [ ] Generated secure JWT_SECRET (32+ chars)
- [ ] MongoDB IP whitelist configured
- [ ] Environment variables not in GitHub
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] CORS origin correctly set

---

## 💡 Helpful Commands

### Test Backend
```bash
curl https://your-railway-backend.up.railway.app/api/health
```

### View Railway Logs
Project → Deployments → Active → View Logs

### View Vercel Logs
Project → Deployments → Latest → Function Logs

### Redeploy
- **Railway**: Variables → Edit → Auto-redeploys
- **Vercel**: Deployments → Latest → Redeploy

---

## 📱 Post-Deployment

1. **Test all features**:
   - Authentication (login/logout)
   - Create/edit/delete materials
   - File uploads
   - Category management

2. **Monitor logs**:
   - Check Railway logs for errors
   - Check Vercel logs for frontend issues

3. **Set up monitoring** (optional):
   - Railway analytics
   - Vercel analytics
   - MongoDB monitoring

---

## 📚 Documentation Links

- Full Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

---

**Need Help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting!
