# Smithery Deployment Guide

This guide will help you deploy the Etsy MCP server to [Smithery](https://smithery.ai), making it accessible as a hosted MCP server.

## What is Smithery?

Smithery is a platform that hosts MCP servers, handling:
- Automatic containerization and deployment
- Infrastructure and scaling
- Discovery through the Smithery registry
- Easy integration with MCP clients like Claude Desktop

## Prerequisites

- GitHub account with your repository
- [Smithery account](https://smithery.ai) (sign up is free)
- Your repository must be public or accessible to Smithery

## Project Structure (Already Configured)

Your project includes all required Smithery files:

```
etsy_mcp/
├── smithery.yaml         # ✅ Smithery configuration
├── package.json          # ✅ With module field
├── src/
│   └── index.ts          # ✅ Exports createServer function
└── tsconfig.json         # ✅ TypeScript config
```

## Deployment Steps

### 1. Push to GitHub

Ensure all files are committed and pushed:

```bash
git add .
git commit -m "Configure for Smithery deployment"
git push origin main
```

### 2. Connect to Smithery

1. Go to [smithery.ai/new](https://smithery.ai/new)
2. Click **"Connect GitHub"**
3. Authorize Smithery to access your repositories
4. Select the `etsy_mcp` repository

### 3. Configure Server Details

Fill in your server information:
- **Name**: Etsy MCP Server
- **Description**: MCP server for Etsy API integration with shop management
- **Category**: E-commerce or API Integration
- **Repository**: Your GitHub URL

### 4. Deploy

1. Navigate to the **Deployments** tab on your server page
2. Click **"Deploy"**
3. Smithery will:
   - Clone your repository
   - Detect the TypeScript runtime from `smithery.yaml`
   - Install dependencies with `npm ci`
   - Build using Smithery CLI
   - Deploy to hosted infrastructure
   - Discover your tools automatically

### 5. Test Your Deployment

Once deployed, your server will be available at:
```
https://server.smithery.ai/your-username/etsy-mcp-server/mcp
```

## Configuration for Users

Users connecting to your Smithery-hosted server will see a configuration form with these fields:

1. **API Key** (required): Etsy API key from Developer Portal
2. **Shop ID** (optional): Their Etsy shop ID for faster operations
3. **Access Token** (optional): OAuth token for write operations

This is automatically generated from the `configSchema` in `src/index.ts`.

## Local Testing Before Deployment

Test your server locally with the Smithery CLI:

```bash
# Install dependencies
npm install

# Start development server with interactive playground
npm run dev
```

This opens the **Smithery Interactive Playground** where you can:
- Test all 19 MCP tools in real-time
- See tool responses and debug issues
- Validate your configuration schema
- Experiment with different inputs

## Build Command

If you want to build without deploying:

```bash
npm run build
```

This uses the Smithery CLI to bundle your server.

## Updating Your Deployment

To deploy updates:

1. Make changes to your code
2. Commit and push to GitHub
3. In Smithery dashboard, click **"Deploy"** again
4. Smithery will rebuild and redeploy automatically

## Environment Variables (Not Needed for Smithery)

When deployed to Smithery:
- ❌ No need for `.env` files
- ❌ No environment variables required
- ✅ Users provide configuration through the form
- ✅ Configuration is encrypted and secure

## Remote vs Local Deployment

### Remote Deployment (Default)
Your current `smithery.yaml` configures **remote deployment**:
```yaml
runtime: "typescript"
```

This means:
- ✅ Hosted on Smithery's infrastructure
- ✅ No local setup needed for users
- ✅ Automatic scaling and monitoring
- ✅ Always available

### Local Deployment (Alternative)
To allow users to run locally instead:
```yaml
runtime: "typescript"
target: "local"
```

With local deployment:
- Server runs on user's machine
- Available in Smithery registry for discovery
- Users need to `npm install` and run locally

**Recommendation**: Stick with remote deployment for easier user experience.

## Troubleshooting

### Build Fails on Smithery

Check these common issues:

1. **Missing dependencies**: All packages must be in `package.json`
2. **TypeScript errors**: Run `npm run compile` locally to check
3. **Module field**: Ensure `package.json` has `"module": "src/index.ts"`
4. **Export structure**: Verify `createServer` is default export

### Server Doesn't Show Tools

Ensure:
- `createServer` function returns the server object
- Tools are registered before returning
- No runtime errors during initialization

### Configuration Form Not Showing

Verify:
- `configSchema` is exported from `src/index.ts`
- Schema uses Zod with proper descriptions
- All fields have `.describe()` calls

## Testing Your Deployed Server

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "etsy": {
      "url": "https://server.smithery.ai/your-username/etsy-mcp-server/mcp",
      "apiKey": "your_etsy_api_key",
      "config": {
        "apiKey": "your_etsy_api_key",
        "shopId": "your_shop_id",
        "accessToken": "your_oauth_token"
      }
    }
  }
}
```

### With MCP Inspector

```bash
npx @modelcontextprotocol/inspector https://server.smithery.ai/your-username/etsy-mcp-server/mcp
```

## Advanced Configuration

### Custom Build Options

Create `smithery.config.js` in your project root:

```javascript
export default {
  esbuild: {
    // Mark packages as external if bundling issues occur
    external: ["some-native-module"],
    
    // Enable minification
    minify: true,
    
    // Set Node.js target
    target: "node18",
  },
};
```

### OAuth Support (Future)

Smithery supports OAuth for remote servers. If you want to add full OAuth flow:

1. Export an `oauth` provider from `src/index.ts`
2. Smithery automatically handles OAuth endpoints
3. See [Smithery OAuth docs](https://smithery.ai/docs/build/oauth)

## Monitoring Your Server

After deployment, Smithery provides:
- **Usage metrics**: How many requests your server receives
- **Error logs**: Any runtime errors or failures
- **Performance data**: Response times and latency
- **User analytics**: How many users are connecting

Access this from your Smithery dashboard.

## Costs

Smithery hosting is:
- **Free tier**: Available for public servers
- **Pro tier**: For private servers or higher usage
- **Enterprise**: Custom infrastructure

Check [smithery.ai/pricing](https://smithery.ai/pricing) for details.

## Support

- 📚 [Smithery Documentation](https://smithery.ai/docs)
- 💬 [Smithery Discord](https://discord.gg/smithery)
- 🐛 [GitHub Issues](https://github.com/your-username/etsy_mcp/issues)

## Next Steps

After deployment:
1. ✅ Test all tools through the playground
2. ✅ Add your server to the public registry (if desired)
3. ✅ Share with the MCP community
4. ✅ Monitor usage and update as needed

Your Etsy MCP server is now production-ready! 🚀
