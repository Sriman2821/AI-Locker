# AI-Locker Deployment Guide - Render + Vercel

Deploy your AI-Locker application with **frontend on Vercel** and **backend on Render**.

---

## 📋 Prerequisites

1. [GitHub account](https://github.com) (for code repository)
2. [Vercel account](https://vercel.com) (free tier available)
3. [Render account](https://render.com) (free tier available)
4. [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (free tier available)
5. Code pushed to GitHub repository

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Prepare MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier M0)
3. Create a database user with username and password
4. Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ai_locker
   ```

### Step 2: Deploy to Render

1. **Login to Render**
   - Go to [Render.com](https://render.com)
   - Sign in with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your AI-Locker repository

3. **Configure Service**
   - **Name**: `ai-locker-backend`
   - **Region**: Oregon (US West) or closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**
   Click "Advanced" → Add Environment Variables:

   ```bash
   NODE_ENV=production
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai_locker
   PORT=10000
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   JWT_SECRET=your_secure_random_32_char_jwt_secret
   ADMIN_EMAIL=admin@gmail.com
   ADMIN_PASSWORD=your_secure_admin_password
   ADMIN_NAME=Admin
   MAX_UPLOAD_SIZE=10485760
   ```

   **Important:**
   - Replace MongoDB URI with your actual connection string
   - Generate a secure JWT_SECRET (32+ characters)
   - Change ADMIN_PASSWORD to something secure
   - You'll update CORS_ORIGIN after deploying frontend

5. **Create Web Service**
   - Click "Create Web Service"
   - Render will build and deploy (takes 2-5 minutes)
   - Once deployed, copy your service URL: `https://ai-locker-backend.onrender.com`

6. **Test Your Backend**
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

**⚠️ Important Notes:**
- Free tier sleeps after 15 minutes of inactivity (first request takes ~30s)
- Disk storage is ephemeral - uploaded files persist only during deployment
- For production uploads, use cloud storage (S3/Cloudinary)

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Update Environment Variables

In Vercel dashboard, you'll add:
```bash
VITE_API_URL=https://your-backend.onrender.com
```
(Use your Render backend URL from Part 1, Step 5)

### Step 2: Deploy to Vercel

1. **Login to Vercel**
   - Go to [Vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your AI-Locker repository

3. **Configure Build Settings**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   - Go to "Environment Variables"
   - Add:
   ```bash
   VITE_API_URL=https://your-backend.onrender.com
   ```
   - Select "Production", "Preview", and "Development"

5. **Deploy**
   - Click "Deploy"
   - Wait for build (1-2 minutes)
   - Copy your Vercel URL: `https://ai-locker.vercel.app`

### Step 3: Update Render CORS Settings

1. **Go back to Render**
   - Navigate to your backend service
   - Go to "Environment" tab
   - Update `CORS_ORIGIN`:
   ```bash
   CORS_ORIGIN=https://your-actual-vercel-app.vercel.app,https://your-app-*.vercel.app
   ```
   
2. **Save Changes**
   - Render will automatically redeploy
   - Wait for completion

---

## ✅ Part 3: Verify Deployment

### Test Your Application

1. **Visit Frontend**
   - Go to: `https://your-app.vercel.app`
   - Application should load

2. **Test Authentication**
   - Login with admin credentials:
     - Email: From your `ADMIN_EMAIL` env var
     - Password: From your `ADMIN_PASSWORD` env var

3. **Check Console**
   - Open DevTools (F12) → Console
   - No CORS errors should appear
   - API calls go to Render backend

4. **Test Features**
   - Add tools, materials, source code
   - Test file uploads
   - Verify everything works

---

## 🔧 Troubleshooting

### Common Issues

**Issue: CORS Errors**
- Solution: Verify `CORS_ORIGIN` in Render matches Vercel URL exactly
- Check Render logs: Service → Logs tab

**Issue: Slow first load**
- Solution: Free tier sleeps after inactivity
- First request wakes service (~30 seconds)
- Consider paid plan or keep-alive service

**Issue: API calls failing**
- Solution: Verify `VITE_API_URL` in Vercel
- Check Render service is running (green status)

**Issue: Database connection errors**
- Solution: Verify MongoDB URI in Render
- Check MongoDB Atlas IP whitelist (0.0.0.0/0)

**Issue: File uploads disappearing**
- Solution: Render has ephemeral storage
- Files lost on redeploy
- Implement S3/Cloudinary for production

### Viewing Logs

**Render Logs:**
- Dashboard → Your Service → Logs tab

**Vercel Logs:**
- Dashboard → Project → Deployments → Select deployment → Logs

---

## 🔄 Updating Your Application

### Update Frontend
1. Push to GitHub
2. Vercel auto-deploys

### Update Backend
1. Push to GitHub
2. Render auto-deploys

### Update Environment Variables
- **Vercel**: Settings → Environment Variables → Edit → Redeploy
- **Render**: Environment → Edit → Auto-redeploys

---

## 📝 Important Notes

### Security Checklist
- ✅ Change default admin password
- ✅ Use strong JWT_SECRET (32+ chars)
- ✅ Restrict MongoDB IP in production (if possible)
- ✅ Only allow your Vercel domain in CORS
- ✅ Never commit `.env` files

### Storage Limitations
- **Render Free Tier**: Ephemeral disk - files lost on redeploy
- **Solution**: Implement cloud storage (AWS S3, Cloudinary, etc.)

### Performance Notes
- **Render Free**: Service sleeps after 15 min inactivity
- **Vercel Free**: 100GB bandwidth/month
- **MongoDB Atlas Free**: M0 cluster (512MB storage)

---

## 🎉 Success!

Your AI-Locker is live:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

---

## 🎯 Next Steps

- [ ] Set up cloud storage (S3/Cloudinary) for file uploads
- [ ] Configure custom domain
- [ ] Set up monitoring/alerts
- [ ] Implement backup strategy
- [ ] Consider upgrading to paid tier for better performance
