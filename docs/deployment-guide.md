# Deployment Guide

## Railway Deployment Commands

Railway sometimes doesn't automatically deploy after git pushes. Use these commands to force a deployment:

### Standard Deployment Process

**Option 1: Using Railway CLI (if linked to project)**
```bash
# 1. Ensure you're in project root directory
cd /c/users/kevth/desktop/stocktake/stocktaking-system

# 2. Check current deployment status
railway status

# 3. Force Railway to redeploy the latest commit from main branch
railway up --detach

# 4. Alternative: specify the service explicitly if needed
railway up --service stocktaking-api --detach
```

**Option 2: Git Push + Railway CLI Deployment (REQUIRED for this project)**
```bash
# 1. Commit and push your changes
git add .
git commit -m "Your commit message"
git push

# 2. CRITICAL: Railway automatic deployment is NOT working for this project
#    You MUST manually trigger deployment after every push:

# Navigate to project root
cd /c/users/kevth/desktop/stocktake/stocktaking-system

# Force deployment using Railway CLI
railway up --service stocktaking-api --detach

# 3. Monitor deployment at: https://railway.app/project/[project-id]
```

**⚠️ CRITICAL:** Railway automatic deployment is NOT working for this project. You MUST manually deploy after every git push using one of these methods:

**Method 1: Railway CLI (if properly linked)**
```bash
railway up --service stocktaking-api --detach
```

**Method 2: Railway Dashboard (if CLI not linked)**
1. Go to Railway project dashboard
2. Select the stocktaking-api service
3. Go to "Deployments" tab
4. Click "Deploy" on the latest commit
5. Wait for deployment to complete

**Method 3: Force deployment with environment linking**
```bash
# First-time setup (if not done)
railway login
railway link [project-id]

# Then deploy
railway up --service stocktaking-api --detach
```

**Option 3: Force Deployment via Railway Dashboard**
1. Go to https://railway.app/project/[project-id]
2. Select the backend service
3. Go to "Deployments" tab
4. Click "Deploy" on the latest commit
5. Wait for deployment to complete

### Verification Steps

After deployment, verify the system is working:

```bash
# Check API health
curl -s "https://stocktaking-api-production.up.railway.app/api/health"

# Test voice recognition endpoint
curl -X POST "https://stocktaking-api-production.up.railway.app/api/master-products/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "becks", "sessionId": "test", "venueId": "test"}'
```

### Troubleshooting

If deployment fails:

1. **Check Railway logs:**
   ```bash
   railway logs
   ```

2. **Verify git status:**
   ```bash
   git status
   git log --oneline -5
   ```

3. **Check environment variables:**
   ```bash
   railway variables
   ```

4. **Manual rebuild:**
   ```bash
   railway up --detach --service stocktaking-api
   ```

### Important Notes

- Railway may not auto-deploy after every git push
- Always use `railway up --detach` to force deployment
- The `--detach` flag allows the deployment to continue in background
- Verify deployment success by checking the health endpoint
- Voice recognition endpoints require the latest deployment with fuzzy search features

### Workflow Optimization

**IMPORTANT:** Due to Railway's unreliable auto-deployment:
- User will manually refresh server and redeploy when changes are ready
- Claude should prompt for manual deployment before self-testing
- This saves time and bandwidth by avoiding repeated failed deployment attempts

### Production URLs

- **Health Check:** https://stocktaking-api-production.up.railway.app/api/health
- **Voice Search:** https://stocktaking-api-production.up.railway.app/api/master-products/search
- **Frontend:** https://stocktaking-system-frontend-production.up.railway.app/

### Environment Variables Required

Ensure these environment variables are set in Railway:

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to "production"
- `PORT` - Railway sets this automatically
- `JWT_SECRET` - JWT signing secret