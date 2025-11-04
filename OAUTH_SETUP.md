# Etsy OAuth Setup Guide

This guide will help you set up OAuth 2.0 authentication to enable shop management features in the Etsy MCP server.

## Why OAuth?

While the Etsy API key allows you to **read** public data (search listings, view shops), you need an **OAuth access token** to:
- Create new listings
- Update or delete your listings
- Manage shop sections
- Update shop information
- Manage inventory

## Prerequisites

1. An Etsy account with a shop
2. An Etsy developer account ([sign up here](https://www.etsy.com/developers/register))
3. A registered app in the Etsy Developer Portal

## Step-by-Step OAuth Setup

### Step 1: Create an Etsy App

1. Go to [Etsy Developer Portal](https://www.etsy.com/developers/your-apps)
2. Click **"Create a New App"**
3. Fill in the required information:
   - **App Name**: Your MCP Server name
   - **Is this app for production?**: Choose based on your needs
   - **Tell us about your app**: Brief description
4. Click **"Read Terms and Create App"**

### Step 2: Configure OAuth Settings

1. In your app dashboard, go to **"API Keys & Access Tokens"**
2. Note your **Keystring** (this is your `ETSY_API_KEY`)
3. Under **OAuth Settings**, add a redirect URI:
   - For local testing: `http://localhost:3000/callback`
   - For production: Your production callback URL
4. Save the settings

### Step 3: Request Authorization

Build an authorization URL with the following format:

```
https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=listings_w%20shops_w%20shops_r%20listings_r&client_id=YOUR_KEYSTRING&state=YOUR_RANDOM_STATE&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=S256
```

**Required Parameters:**
- `response_type`: Always `code`
- `redirect_uri`: Must match your registered URI (URL encoded)
- `scope`: Space-separated permissions (URL encoded):
  - `listings_r` - Read listings
  - `listings_w` - Write/manage listings
  - `shops_r` - Read shop info
  - `shops_w` - Update shop info
  - `transactions_r` - Read orders
  - `transactions_w` - Update orders
- `client_id`: Your app's Keystring
- `state`: Random string for security
- `code_challenge`: PKCE challenge (base64url encoded SHA256 hash)
- `code_challenge_method`: Always `S256`

### Step 4: Generate PKCE Code Verifier and Challenge

PKCE (Proof Key for Code Exchange) is required for security. Here's a Node.js example:

```javascript
const crypto = require('crypto');

// Generate code verifier
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// Generate code challenge
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

console.log('Code Verifier:', codeVerifier);
console.log('Code Challenge:', codeChallenge);
```

**Save the code verifier** - you'll need it in the next step!

### Step 5: User Authorization

1. Open the authorization URL in a browser
2. Log in to Etsy (if not already logged in)
3. Review the permissions your app is requesting
4. Click **"Allow Access"**
5. You'll be redirected to your callback URL with a `code` parameter:
   ```
   http://localhost:3000/callback?code=AUTHORIZATION_CODE&state=YOUR_STATE
   ```

### Step 6: Exchange Code for Access Token

Make a POST request to exchange the authorization code for an access token:

```bash
curl -X POST "https://api.etsy.com/v3/public/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_KEYSTRING" \
  -d "redirect_uri=YOUR_REDIRECT_URI" \
  -d "code=AUTHORIZATION_CODE" \
  -d "code_verifier=YOUR_CODE_VERIFIER"
```

**Node.js Example:**

```javascript
const axios = require('axios');

const data = new URLSearchParams({
  grant_type: 'authorization_code',
  client_id: 'YOUR_KEYSTRING',
  redirect_uri: 'http://localhost:3000/callback',
  code: 'AUTHORIZATION_CODE_FROM_CALLBACK',
  code_verifier: 'YOUR_CODE_VERIFIER_FROM_STEP_4'
});

axios.post('https://api.etsy.com/v3/public/oauth/token', data, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
})
.then(response => {
  console.log('Access Token:', response.data.access_token);
  console.log('Refresh Token:', response.data.refresh_token);
  console.log('Expires In:', response.data.expires_in, 'seconds');
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

**Response:**
```json
{
  "access_token": "YOUR_ACCESS_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "YOUR_REFRESH_TOKEN"
}
```

### Step 7: Add Token to Environment

Add the access token to your `.env` file:

```bash
ETSY_API_KEY=your_keystring_here
ETSY_SHOP_ID=your_shop_id
ETSY_ACCESS_TOKEN=your_access_token_here
```

Or add it to your Claude Desktop config:

```json
{
  "mcpServers": {
    "etsy": {
      "command": "node",
      "args": ["C:\\path\\to\\etsy_mcp\\build\\index.js"],
      "env": {
        "ETSY_API_KEY": "your_keystring",
        "ETSY_ACCESS_TOKEN": "your_access_token"
      }
    }
  }
}
```

## Token Refresh

Access tokens expire after 1 hour. Use the refresh token to get a new access token:

```bash
curl -X POST "https://api.etsy.com/v3/public/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=YOUR_KEYSTRING" \
  -d "refresh_token=YOUR_REFRESH_TOKEN"
```

## Quick Test Script

Save this as `oauth-helper.js`:

```javascript
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const CLIENT_ID = 'YOUR_KEYSTRING_HERE';
const REDIRECT_URI = 'http://localhost:3000/callback';
const STATE = crypto.randomBytes(16).toString('hex');
const CODE_VERIFIER = crypto.randomBytes(32).toString('base64url');
const CODE_CHALLENGE = crypto.createHash('sha256').update(CODE_VERIFIER).digest('base64url');

const scopes = 'listings_r listings_w shops_r shops_w';
const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&client_id=${CLIENT_ID}&state=${STATE}&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256`;

console.log('\n=== Etsy OAuth Helper ===\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. After authorization, copy the "code" parameter from the redirect URL\n');

rl.question('Enter the authorization code: ', async (code) => {
  const axios = require('axios');
  
  try {
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code: code.trim(),
      code_verifier: CODE_VERIFIER
    });

    const response = await axios.post('https://api.etsy.com/v3/public/oauth/token', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log('\n✅ Success! Add these to your .env file:\n');
    console.log(`ETSY_ACCESS_TOKEN=${response.data.access_token}`);
    console.log(`ETSY_REFRESH_TOKEN=${response.data.refresh_token}`);
    console.log(`\nToken expires in: ${response.data.expires_in} seconds`);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
  
  rl.close();
});
```

Run it with:
```bash
npm install axios
node oauth-helper.js
```

## Troubleshooting

### "Invalid redirect_uri"
Make sure the redirect URI in your request exactly matches the one registered in your app settings.

### "Invalid code_verifier"
Ensure you're using the same code_verifier that was used to generate the code_challenge.

### "Token expired"
Access tokens expire after 1 hour. Use the refresh token to get a new one.

### "Insufficient scope"
Request the appropriate scopes during authorization:
- `listings_w` for creating/updating listings
- `shops_w` for updating shop info

## Security Best Practices

1. **Never commit tokens** to version control - use `.env` files
2. **Store refresh tokens securely** - they don't expire
3. **Use PKCE** - always include code_challenge
4. **Validate state parameter** - prevents CSRF attacks
5. **Use HTTPS in production** - HTTP is only for local testing

## Resources

- [Etsy OAuth Documentation](https://developers.etsy.com/documentation/essentials/authentication/)
- [Etsy API Reference](https://developers.etsy.com/documentation/reference)
- [OAuth 2.0 PKCE Specification](https://tools.ietf.org/html/rfc7636)
