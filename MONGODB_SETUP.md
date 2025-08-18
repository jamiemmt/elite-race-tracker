# MongoDB Connection Troubleshooting

## Common Issues

Based on the Heroku logs showing `querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net`, we've identified an issue with MongoDB Atlas DNS resolution in the Heroku environment.

## Fix Instructions

### 1. Verify MongoDB Atlas Connection String

Ensure your MongoDB Atlas connection string follows this exact format:

```
mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database?retryWrites=true&w=majority
```

Key points:
- Use `mongodb+srv://` (not just `mongodb://`) for Atlas connections
- Make sure your cluster name is correct
- Include the database name after the last `/`
- Don't forget query parameters like `retryWrites=true&w=majority`

### 2. Update Heroku Environment Variable

```bash
# Replace with your correct connection string
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database?retryWrites=true&w=majority"
```

### 3. Test Connection

Use our verification script:

```bash
# Run locally to test
node server/scripts/verify-mongodb.js

# Or provide connection string directly:
node server/scripts/verify-mongodb.js "mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database"
```

### 4. Verify IP Whitelist

Ensure that Heroku's IP addresses can access your MongoDB Atlas cluster:

1. In MongoDB Atlas dashboard → Network Access
2. Add `0.0.0.0/0` to allow access from anywhere (only for testing)
3. For production, set up a more restricted IP range

## Heroku Deployment Notes

- We've improved error handling in the server code to provide better diagnostics
- Scrapers now have fallback functionality to serve sample data even if MongoDB is unavailable
- The app can run without MongoDB, but won't save or retrieve data from the database

After fixing MongoDB, remember to:

1. Restart your Heroku dynos: `heroku restart`
2. Check logs for connection success: `heroku logs --tail`
