# Deployment Guide

This guide will help you deploy the Oso HR App to various cloud platforms.

## Pre-Deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] `.env` file is in `.gitignore` (API keys should not be committed)
- [ ] `.env.example` file exists with all required variables
- [ ] `package.json` has correct dependencies and scripts
- [ ] Database is properly configured
- [ ] Oso Cloud policies are uploaded

## Quick Start with Railway (Recommended for Full-Stack Apps)

### 1. Prepare Your Repository
```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js app

### 3. Configure Environment Variables
In the Railway dashboard, go to your project → Variables tab and add:
- `OSO_AUTH_API_KEY`: Your Oso Cloud API key
- `JWT_SECRET`: Generate a strong random string (32+ characters)
- `NODE_ENV`: `production`

### 4. Deploy
Railway will automatically build and deploy your app! You'll get a live URL.

## Alternative: Vercel

### 1. Prepare Your Repository
```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Node.js app

### 3. Configure Environment Variables
In the Vercel dashboard, go to your project settings and add:
- `OSO_AUTH_API_KEY`: Your Oso Cloud API key
- `JWT_SECRET`: Generate a strong random string (32+ characters)
- `NODE_ENV`: `production`

### 4. Deploy
Click "Deploy" and Vercel will build and deploy your app!

## Alternative Platforms

### Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Create a new project from your repository
4. Add environment variables in the dashboard
5. Deploy

### Render
1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OSO_AUTH_API_KEY` | Your Oso Cloud API key | Yes | `e_5OwzfZPeOlYhTK1hYnmzNx_7TwbQVCJQEU_2L6HY8qkI6fUlzAuUa90So18D33r` |
| `JWT_SECRET` | Secret for JWT token signing | Yes | `your-super-secret-jwt-key-here-change-in-production` |
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | No | `3000` (default) |
| `DB_PATH` | Database file path | No | `./database.sqlite` (default) |

## Post-Deployment Steps

1. **Test the deployment**: Visit your deployed URL and test login
2. **Verify Oso Cloud integration**: Check that authorization is working
3. **Test all user roles**: Login as CEO, Manager, and Employee
4. **Test time-off requests**: Submit and approve requests
5. **Monitor logs**: Check for any errors in the platform's logs

## Troubleshooting

### Common Issues

**"Cannot read properties of undefined (reading 'trim')"**
- This means `OSO_AUTH_API_KEY` is not set
- Add the environment variable to your deployment platform

**"Database not found"**
- The SQLite database is created automatically on first run
- Make sure the app has write permissions

**"Authorization failed"**
- Check that your Oso Cloud API key is correct
- Verify that policies are uploaded to Oso Cloud
- Check that user facts are synced

### Getting Help

- Check the platform's documentation
- Look at the deployment logs
- Test locally first to isolate issues
- Check that all environment variables are set correctly

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Regularly rotate your API keys
- Monitor your application logs for suspicious activity
