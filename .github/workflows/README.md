# GitHub Actions Workflow Setup Guide

This guide explains how to configure the automated price scraping workflow with notifications.

## Overview

The workflow runs daily at 8:00 AM UTC (11:30 AM Tehran time) and:
1. Scrapes prices from Digikala for all products in `items.xlsx`
2. Updates individual Excel files in the `items/` folder
3. Converts Excel files to JSON for the dashboard
4. Commits changes with detailed statistics
5. Sends notifications if scraping fails

## Features

### 📊 Detailed Commit Messages

Commit messages now include:
- Date of scraping
- Number of products with price data
- Number of out of stock/failed products
- Number of skipped products (already updated)
- Total products tracked
- Success rate percentage

Example:
```
📊 Price update for 2026-02-02

✅ Products with price data: 45
⚠️ Out of stock / Failed: 5
⏭️ Skipped (already updated): 10
📊 Total tracked: 60
📈 Success rate: 75%
```

### 🔔 Failure Notifications

The workflow includes **5 notification methods**. Choose the one that works best for you:

#### Option 1: SMTP Email (Recommended for most users)

**Setup:**
1. Go to your repository Settings → Secrets and variables → Actions
2. Add these secrets:
   - `SMTP_SERVER`: Your email provider's SMTP server (e.g., `smtp.gmail.com`)
   - `SMTP_PORT`: Port number (usually `587` for TLS)
   - `SMTP_USERNAME`: Your email address
   - `SMTP_PASSWORD`: Your email password or app-specific password
   - `NOTIFICATION_EMAIL`: Email address to receive notifications
   - `SMTP_FROM`: (Optional) Sender name (defaults to `pmonitor@github-actions.com`)

**Gmail users:** Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

#### Option 2: SendGrid (Best for reliability)

**Setup:**
1. Create a free account at [SendGrid](https://sendgrid.com/)
2. Generate an API key
3. Add these secrets:
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `NOTIFICATION_EMAIL`: Email to receive notifications
   - `FROM_EMAIL`: (Optional) Verified sender email

#### Option 3: GitHub Issues (Zero setup, but requires manual checking)

**No setup required!** 

When scraping fails, the workflow automatically creates a GitHub Issue with:
- Failure timestamp
- Link to the failed run
- Troubleshooting checklist
- Assignment to repository owner

#### Option 4: Slack (For teams)

**Setup:**
1. Create a Slack webhook URL in your workspace
2. Add secret: `SLACK_WEBHOOK_URL`

#### Option 5: Discord (For communities)

**Setup:**
1. Create a Discord webhook in your server
2. Add secret: `DISCORD_WEBHOOK`

## Manual Trigger

You can manually run the workflow anytime:

1. Go to Actions tab in your repository
2. Click "Daily Price Scraping"
3. Click "Run workflow"
4. Optionally enable verbose logging
5. Click "Run workflow"

## Artifacts

The workflow saves two types of artifacts:

### 1. Scraping Statistics (`stats.json`)
- Saved after every run (success or failure)
- Contains: date, total items, processed, skipped, failed counts
- Retained for 30 days
- Download from the Actions run page

### 2. Debug Logs (only on failure)
- Captures any `.log` files and `output.json`
- Retained for 7 days
- Useful for debugging API issues

## Troubleshooting

### Workflow fails with "No changes to commit"

This is normal! It means all products were already updated today. The workflow will run again tomorrow.

### All products show as "Failed"

Possible causes:
1. **API structure changed** - Check if Digikala updated their API
2. **Rate limiting** - The delays might need adjustment
3. **Network issues** - Check GitHub Actions status

Check the debug logs artifact for specific error messages.

### Email notifications not working

1. Verify all SMTP secrets are set correctly
2. Check spam/junk folders
3. For Gmail: Ensure "Less secure app access" is enabled or use App Password
4. Check workflow logs for specific email errors

### Success rate is consistently low

This might mean:
- Products are genuinely out of stock
- The API is having issues
- Time to review and update `items.xlsx` with new products

## Monitoring

### View Recent Commits

Check the commit history to see daily statistics:
```bash
git log --oneline --all | head -10
```

### Check Stats History

Download artifacts from recent runs to track trends over time.

## Configuration

### Environment Variables

You can customize behavior with these environment variables in the workflow:

- `VERBOSE`: `'true'` or `'false'` - Enable detailed logging
- `OUTPUT`: `'true'` or `'false'` - Write to Excel files
- `MAX_RETRIES`: Number of retry attempts (default: 3)
- `RETRY_DELAY`: Delay between retries in ms (default: 1000)
- `DELAY`: Base delay between API requests in ms (default: 2500)

### Adjusting Timing

The workflow runs at 8:00 AM UTC by default. To change this, edit the cron expression:

```yaml
schedule:
  - cron: '0 8 * * *'  # Current: 8 AM UTC
  - cron: '0 5 * * *'  # Example: 5 AM UTC (earlier)
```

Use [crontab.guru](https://crontab.guru/) to generate custom schedules.

## Best Practices

1. **Enable at least one notification method** - Don't rely solely on checking GitHub
2. **Use GitHub Issues as backup** - They persist and create a failure history
3. **Review artifacts periodically** - Download stats.json to track trends
4. **Keep dependencies updated** - Run `npm audit` periodically
5. **Monitor success rate** - If it drops consistently, investigate

## Security Notes

- Never commit email credentials to the repository
- Use GitHub Secrets for all sensitive data
- App passwords are safer than regular passwords for Gmail
- SendGrid and other services provide better security than raw SMTP

## Support

If the workflow fails repeatedly:
1. Check the GitHub Issue created automatically
2. Download and review the debug logs artifact
3. Test locally: `cd scripts && node webScraping.js`
4. Open a GitHub Issue with the error details
