# Deployment Guide

## Railway Deployment

### Prerequisites
- Railway CLI installed (`npm install -g @railway/cli`)
- Railway account connected (`railway login`)
- GitHub repository connected to Railway

### Deployment Process

After committing changes to git:

```bash
# 1. Commit and push to GitHub
git add .
git commit -m "your message"
git push

# 2. Force Railway deployment
railway up --service stocktaking-api --detach

# 3. Wait for deployment (approx 60 seconds)
sleep 60

# 4. Verify deployment
curl -s "https://stocktaking-api-production.up.railway.app/api/health"
```

### Important Notes

- Railway deployments **must be forced manually** using `railway up --service stocktaking-api --detach`
- Deployment takes approximately 60 seconds
- Always verify the health endpoint shows the correct version after deployment

### Environment Variables

Required on Railway:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Railway)
- `PORT` - Application port (auto-configured by Railway)

---

**Version**: 2.0.1
