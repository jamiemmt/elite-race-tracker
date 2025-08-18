# Elite Race Tracker Deployment Guide

This guide provides step-by-step instructions for deploying the Elite Race Tracker application to Heroku.

## Prerequisites

- Heroku CLI installed
- Git installed
- Node.js 18.x installed
- MongoDB Atlas account (for production database)

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd elite-race-tracker
```

### 2. Create Heroku App

```bash
heroku create elite-race-tracker
```

### 3. Configure MongoDB Atlas

1. Create a cluster in MongoDB Atlas
2. Set up a database user with appropriate permissions
3. Whitelist IP addresses (use `0.0.0.0/0` for development, but restrict for production)
4. Get your connection string in the format:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

### 4. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-atlas-connection-string"
```

Add any other environment variables your application requires.

## Deployment

### 1. Configure Git Remote

If not already set up:

```bash
heroku git:remote -a elite-race-tracker
```

### 2. Deploy Code

```bash
git push heroku main
```

Or if you're using a different branch:

```bash
git push heroku your-branch:main
```

### 3. Verify Deployment

```bash
heroku open
```

Check logs for any errors:

```bash
heroku logs --tail
```

## Setting Up Heroku Scheduler

To schedule scrapers to run periodically:

1. Install the Heroku Scheduler add-on:
   ```bash
   heroku addons:create scheduler:standard
   ```

2. Open the scheduler dashboard:
   ```bash
   heroku addons:open scheduler
   ```

3. Add a new job:
   - Task: `node server/scripts/run-all-scrapers.js`
   - Frequency: Daily (recommended)
   - Next Due: Select appropriate time

## Troubleshooting

### MongoDB Connection Issues

If you encounter MongoDB connection problems, use our verification script:

```bash
node server/scripts/verify-mongodb.js
```

See `MONGODB_SETUP.md` for detailed MongoDB troubleshooting.

### Empty Scraper Results

If scrapers return empty results, check:

1. Scraper-specific logs in the Heroku logs
2. MongoDB connection status
3. Scraper module loading - each scraper should be properly loaded

### Puppeteer Issues in Heroku

Puppeteer requires specific buildpacks and configurations to work in Heroku:

1. Add the necessary buildpacks:
   ```bash
   heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack
   heroku buildpacks:add --index 2 heroku/nodejs
   ```

2. Our Boston Marathon scraper is configured to detect Heroku environment and fall back to sample data to avoid Puppeteer issues.

### React Build Issues

If React build fails during deployment:

1. Check that the `heroku-postbuild` script is correctly set in `package.json`
2. Verify that client dependencies are properly listed in client's `package.json`
3. Check Heroku build logs for specific errors

## Continuous Deployment

We have GitHub integration set up for continuous deployment:

1. Connect your Heroku app to GitHub in the Heroku dashboard
2. Enable automatic deploys for your chosen branch
3. Optionally, enable "Wait for CI to pass before deploy" if using CI services

## Monitoring

Monitor your application using:

```bash
heroku logs --tail
```

For more comprehensive monitoring, consider adding Heroku add-ons like:
- New Relic
- Papertrail
- LogDNA

## Scaling

If needed, scale your application:

```bash
heroku ps:scale web=1:standard-1x
```

## Best Practices

1. Always test locally before deploying
2. Use environment variables for configuration
3. Monitor application logs regularly
4. Set up proper error handling and logging
5. Have fallback mechanisms for scrapers
6. Maintain updated documentation

## Common Commands

```bash
# View logs
heroku logs --tail

# Restart the application
heroku restart

# Run a one-time scraper job
heroku run node server/scripts/run-all-scrapers.js

# Open the application
heroku open

# Check current config vars
heroku config

# Scale dynos
heroku ps:scale web=1
```
