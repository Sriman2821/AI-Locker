# AI-Locker Deployment Guide

This guide will walk you through deploying your AI-Locker application with the **frontend on Vercel** and the **backend on Railway**.

---

## 📋 Prerequisites

Before you begin, make sure you have:

1. A [GitHub account](https://github.com) (for code repository)
2. A [Vercel account](https://vercel.com) (free tier available)
3. A [Railway account](https://railway.app) (free trial available)
4. A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (free tier available)
5. Your code pushed to a GitHub repository

---

## 🚀 Part 1: Deploy Backend to Railway

### Step 1: Prepare MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier M0 is sufficient)
3. Create a database user with username and password
4. Whitelist all IP addresses (0.0.0.0/0) for Railway access
5. Get your connection string - it should look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ai_locker
   ```

### Step 2: Deploy to Railway

1. **Login to Railway**
   - Go to [Railway.app](https://railway.app)
   - Sign in with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your AI-Locker repository
   - Select the repository root (the server folder will be auto-detected)

3. **Configure Build Settings**
   - Railway should auto-detect Node.js
   - Set the **Root Directory** to: `server`
   - The build command will be: `npm install`
   - The start command will be: `npm start`

4. **Add Environment Variables**
   - Go to your project → Variables tab
   - Add the following variables:

   ```bash
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string_here
   PORT=5010
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   JWT_SECRET=your_secure_random_32_char_jwt_secret
   ADMIN_EMAIL=admin@gmail.com
   ADMIN_PASSWORD=your_secure_admin_password
   ADMIN_NAME=Admin
   MAX_UPLOAD_SIZE=10485760
   ```

   **Important Notes:**
   - Replace `your_mongodb_connection_string_here` with your actual MongoDB URI
   - Replace `https://your-vercel-app.vercel.app` with your actual Vercel URL (you'll update this after deploying frontend)
   - Generate a secure random string for `JWT_SECRET` (at least 32 characters)
   - Change the `ADMIN_PASSWORD` to something secure!

5. **Deploy**
   - Railway will automatically deploy your backend
   - Wait for the deployment to complete
   - Once deployed, click on "Settings" → "Generate Domain" to get your backend URL
   - **Copy this URL** (e.g., `https://ai-locker-production.up.railway.app`) - you'll need it for the frontend!

6. **Test Your Backend**
   - Visit: `https://your-railway-backend.up.railway.app/api/health`
   - You should see: `{"status":"ok","timestamp":"..."}`

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend Configuration

1. **Update Environment Variables Locally**
   - Navigate to the `client` folder
   - Create or update `.env.production` file:
   ```bash
   VITE_API_URL=https://your-railway-backend.up.railway.app
   ```
   - Replace with your actual Railway backend URL from Part 1, Step 5

2. **Commit Changes** (if you modified .env.production)
   ```bash
   git add .
   git commit -m "Update production API URL"
   git push
   ```

### Step 2: Deploy to Vercel

1. **Login to Vercel**
   - Go to [Vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your AI-Locker repository
   - Vercel will detect it as a Vite project

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as root (the monorepo structure is configured in vercel.json)
   - **Build Command**: `cd client && npm install && npm run build` (already in vercel.json)
   - **Output Directory**: `client/dist` (already in vercel.json)

4. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add the following:
   
   ```bash
   VITE_API_URL=https://your-railway-backend.up.railway.app
   ```
   
   - Make sure to select "Production" environment

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Once deployed, you'll get a URL like: `https://ai-locker.vercel.app`

### Step 3: Update Railway CORS Settings

1. **Go back to Railway**
   - Navigate to your backend project
   - Go to Variables tab
   - Update the `CORS_ORIGIN` variable with your Vercel URL:
   ```bash
   CORS_ORIGIN=https://your-actual-vercel-app.vercel.app
   ```
   
2. **Redeploy Backend**
   - Railway will automatically redeploy with the new CORS settings
   - Wait for redeployment to complete

---

## ✅ Part 3: Verify Deployment

### Test Your Application

1. **Visit Your Frontend**
   - Go to your Vercel URL: `https://your-app.vercel.app`
   - The application should load

2. **Test Authentication**
   - Click on Login
   - Use the admin credentials:
     - Email: `admin@gmail.com` (or whatever you set in Railway)
     - Password: Your `ADMIN_PASSWORD` from Railway

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Make sure there are no CORS errors
   - API calls should be going to your Railway backend URL

4. **Test Functionality**
   - Try adding a tool, material, or source code
   - Test file uploads
   - Verify everything works as expected

---

## 🔧 Troubleshooting

### Common Issues

**Issue: CORS Errors**
- **Solution**: Make sure `CORS_ORIGIN` in Railway matches your Vercel URL exactly (including https://)
- Check Railway logs: Project → Deployments → View Logs

**Issue: API calls failing**
- **Solution**: Verify `VITE_API_URL` in Vercel environment variables
- Make sure Railway backend is running (check deployment status)

**Issue: Database connection errors**
- **Solution**: Verify MongoDB URI in Railway
- Check that MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
- Test connection from Railway logs

**Issue: Admin login not working**
- **Solution**: Check Railway logs to see if admin was created
- Run seed script manually if needed (Railway console)
- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Railway variables

**Issue: File uploads not working**
- **Solution**: Check `MAX_UPLOAD_SIZE` in Railway
- Railway has ephemeral storage - consider using cloud storage (AWS S3, Cloudinary) for production
- Files will be lost on Railway redeployments unless you implement persistent storage

### Viewing Logs

**Railway Logs:**
- Go to your project → Deployments → Select active deployment → View Logs

**Vercel Logs:**
- Go to your project → Deployments → Select deployment → Function Logs

---

## 🔄 Updating Your Application

### Update Frontend
1. Make changes to your code
2. Commit and push to GitHub
3. Vercel will automatically redeploy

### Update Backend
1. Make changes to your code
2. Commit and push to GitHub
3. Railway will automatically redeploy

### Update Environment Variables
- **Vercel**: Settings → Environment Variables → Edit → Redeploy
- **Railway**: Variables → Edit → Automatically redeploys

---

## 📝 Important Notes

### Security Considerations

1. **Change Default Credentials**: Update `ADMIN_PASSWORD` immediately after first deployment
2. **JWT Secret**: Use a strong, random JWT_SECRET (minimum 32 characters)
3. **Environment Variables**: Never commit `.env` files to GitHub
4. **MongoDB**: Restrict IP access in production if possible
5. **CORS**: Only allow your Vercel domain in production

### Storage Limitations

- **Railway**: Has ephemeral storage - uploaded files will be lost on redeployments
- **Solution**: Implement cloud storage (AWS S3, Cloudinary, etc.) for production file uploads

### Cost Considerations

- **Vercel Free Tier**: 100GB bandwidth/month
- **Railway Free Trial**: $5 credit (then pay-as-you-go)
- **MongoDB Atlas**: Free tier M0 cluster (512MB storage)

---

## 🎉 Success!

Your AI-Locker application is now live!

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-railway-backend.up.railway.app

Need help? Check the logs or review the configuration files:
- `vercel.json` - Frontend deployment configuration
- `server/railway.json` - Backend deployment configuration
- `server/nixpacks.toml` - Railway build configuration

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
