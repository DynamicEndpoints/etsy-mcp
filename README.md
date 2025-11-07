# Etsy MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with the Etsy API v3. This server enables AI assistants and applications to interact with Etsy's marketplace, search listings, retrieve shop information, and access product details.

**🚀 Deploy to Smithery**: This server is ready for deployment to [Smithery](https://smithery.ai) for hosted, always-available access. See [SMITHERY_DEPLOYMENT.md](./SMITHERY_DEPLOYMENT.md) for instructions.

## Features

- 🔍 **Search Listings**: Search for active Etsy listings with keyword filtering
- 🏪 **Shop Information**: Get detailed shop information and listings
- 📦 **Product Details**: Access listing inventory, images, and variations
- 📊 **Trending Data**: Retrieve trending listings on Etsy
- ✏️ **Create & Update Listings**: Post new products and manage existing ones
- 🎨 **Manage Shop Sections**: Organize your shop with categories
- 🛠️ **Full Shop Management**: Update shop info, inventory, images, and more
- 🔐 **OAuth Support**: Secure authenticated access for write operations
- 💬 **Smart Prompts**: Pre-built prompts for listing creation, SEO optimization, pricing, and analytics
- 📚 **Comprehensive Resources**: Built-in guides for SEO, photography, shipping, and seller best practices
- 🏷️ **Tool Annotations**: All 19 tools include readOnlyHint, destructiveHint, and idempotentHint for better AI understanding
- ⚙️ **Zero Configuration**: Works out-of-the-box with sensible defaults, fully configurable via environment variables
- � **Built with Latest MCP Standards**: Uses @modelcontextprotocol/sdk v1.0.4

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd etsy_mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Smithery Deployment (Recommended)

Deploy to Smithery for hosted, always-available access:

1. Push your code to GitHub
2. Connect to [Smithery](https://smithery.ai/new)
3. Click Deploy

**📖 Full Guide**: See [SMITHERY_DEPLOYMENT.md](./SMITHERY_DEPLOYMENT.md) for complete deployment instructions.

## Local Development

Test locally with the Smithery interactive playground:

```bash
npm run dev
```

Or compile TypeScript manually:

```bash
npm run compile
```

## Configuration

### Getting an Etsy API Key

1. Visit the [Etsy Developer Portal](https://www.etsy.com/developers)
2. Create a new app or use an existing one
3. Generate an API key (also called "Keystring")
4. For shop management features, set up OAuth 2.0 to get an access token
5. Set up your environment variables (see below)

### OAuth Access Token (for Shop Management)

To create, update, or delete listings and manage your shop, you need an OAuth access token:

1. In the Etsy Developer Portal, configure OAuth redirect URLs
2. Follow the [Etsy OAuth 2.0 flow](https://developers.etsy.com/documentation/essentials/authentication/)
3. Exchange the authorization code for an access token
4. Add the access token to your environment variables

**📖 Detailed Guide**: See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for complete step-by-step instructions with code examples.

**Note**: Read-only operations (searching, viewing listings) only require the API key.

### Environment Variables (All Optional)

The server works out-of-the-box without any configuration. For production use with your own shop, you can set the following environment variables:

```bash
ETSY_API_KEY=your_etsy_api_key_here        # Optional: Defaults to demo mode
ETSY_SHOP_ID=your_shop_id                   # Optional: For faster shop operations
ETSY_ACCESS_TOKEN=your_oauth_access_token   # Optional: Required only for write operations
```

**Note**: 
- Without an API key, the server runs in demo mode for documentation/testing purposes
- Read-only operations (searching, viewing listings) require an API key
- Write operations (creating/updating listings) require both API key and OAuth access token

## Usage with Claude Desktop

### Option 1: Smithery Hosted (Recommended)

After deploying to Smithery, use the hosted URL:

```json
{
  "mcpServers": {
    "etsy": {
      "url": "https://server.smithery.ai/your-username/etsy-mcp-server/mcp",
      "config": {
        "apiKey": "your_etsy_api_key",
        "shopId": "your_shop_id",
        "accessToken": "your_oauth_token"
      }
    }
  }
}
```

### Option 2: Local Execution

Add this server to your Claude Desktop configuration:

### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "etsy": {
      "command": "node",
      "args": ["C:\\Users\\Owner\\etsy_mcp\\build\\index.js"],
      "env": {
        "ETSY_API_KEY": "your_etsy_api_key_here",
        "ETSY_ACCESS_TOKEN": "your_oauth_token_here"
      }
    }
  }
}
```

### macOS/Linux
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "etsy": {
      "command": "node",
      "args": ["/path/to/etsy_mcp/build/index.js"],
      "env": {
        "ETSY_API_KEY": "your_etsy_api_key_here",
        "ETSY_ACCESS_TOKEN": "your_oauth_token_here"
      }
    }
  }
}
```

## Available Tools

### Read-Only Tools (API Key Only)

### 1. search_listings
Search for active Etsy listings with keyword filtering.

**Parameters:**
- `keywords` (required): Search keywords
- `limit`: Maximum results (default: 25, max: 100)
- `offset`: Results to skip for pagination
- `min_price`: Minimum price filter
- `max_price`: Maximum price filter
- `sort_on`: Field to sort by (created, price, updated, score)
- `sort_order`: Sort direction (asc, desc)

**Example:**
```json
{
  "keywords": "handmade jewelry",
  "limit": 10,
  "sort_on": "price",
  "sort_order": "asc"
}
```

### 2. get_listing
Get detailed information about a specific listing.

**Parameters:**
- `listing_id` (required): Numeric listing ID
- `includes`: Array of additional data (Shop, Images, User, Translations, Inventory)

**Example:**
```json
{
  "listing_id": 1234567890,
  "includes": ["Images", "Shop"]
}
```

### 3. get_shop
Get information about an Etsy shop.

**Parameters:**
- `shop_id` (required): Numeric shop ID

### 4. get_shop_listings
Get all listings from a specific shop.

**Parameters:**
- `shop_id` (required): Numeric shop ID
- `limit`: Maximum results (default: 25)
- `offset`: Results to skip
- `state`: Filter by state (active, inactive, sold_out, draft, expired)

### 5. search_shops
Search for Etsy shops by name.

**Parameters:**
- `shop_name` (required): Shop name to search
- `limit`: Maximum results
- `offset`: Results to skip

### 6. get_listing_inventory
Get inventory information including quantities and variations.

**Parameters:**
- `listing_id` (required): Numeric listing ID

### 7. get_listing_images
Get all images for a listing.

**Parameters:**
- `listing_id` (required): Numeric listing ID

### 8. get_shop_sections
Get shop sections/categories.

**Parameters:**
- `shop_id` (required): Numeric shop ID

### 9. get_trending_listings
Get currently trending listings on Etsy.

**Parameters:**
- `limit`: Maximum results (default: 25)
- `offset`: Results to skip

### 10. find_shops
Find shops by location or other criteria.

**Parameters:**
- `location`: Location to search
- `limit`: Maximum results
- `offset`: Results to skip

---

### Shop Management Tools (Require OAuth Access Token)

### 11. create_listing
Create a new product listing in your shop.

**Parameters:**
- `shop_id` (required): Your shop ID
- `quantity` (required): Available quantity
- `title` (required): Listing title (max 140 characters)
- `description` (required): Item description
- `price` (required): Price in shop currency
- `who_made` (required): i_did, someone_else, or collective
- `when_made` (required): e.g., made_to_order, 2020_2023
- `taxonomy_id` (required): Category taxonomy ID
- `shipping_profile_id`: Shipping profile ID (optional)
- `shop_section_id`: Shop section ID (optional)
- `tags`: Array of tags, max 13 (optional)

**Example:**
```json
{
  "shop_id": 12345678,
  "quantity": 10,
  "title": "Handmade Ceramic Mug",
  "description": "Beautiful handcrafted ceramic mug...",
  "price": 25.99,
  "who_made": "i_did",
  "when_made": "made_to_order",
  "taxonomy_id": 1234,
  "tags": ["ceramic", "mug", "handmade", "pottery"]
}
```

### 12. update_listing
Update an existing listing's details.

**Parameters:**
- `shop_id` (required): Your shop ID
- `listing_id` (required): Listing ID to update
- `title`: New title
- `description`: New description
- `price`: New price
- `quantity`: New quantity
- `tags`: New tags array
- `shop_section_id`: Shop section ID

**Example:**
```json
{
  "shop_id": 12345678,
  "listing_id": 987654321,
  "price": 29.99,
  "quantity": 15
}
```

### 13. delete_listing
Remove a listing from your shop.

**Parameters:**
- `listing_id` (required): Listing ID to delete

### 14. update_listing_inventory
Update inventory details including variations, SKUs, and quantities.

**Parameters:**
- `listing_id` (required): Listing ID
- `products` (required): Array of product variations
- `price_on_property`: Property IDs affecting price
- `quantity_on_property`: Property IDs affecting quantity
- `sku_on_property`: Property IDs affecting SKU

### 15. upload_listing_image
Add an image to a listing.

**Parameters:**
- `shop_id` (required): Your shop ID
- `listing_id` (required): Listing ID
- `image_url` (required): URL of the image
- `rank`: Display order (1 = primary)
- `alt_text`: Accessibility text

### 16. create_shop_section
Create a new section/category in your shop.

**Parameters:**
- `shop_id` (required): Your shop ID
- `title` (required): Section title

**Example:**
```json
{
  "shop_id": 12345678,
  "title": "Holiday Collection"
}
```

### 17. update_shop_section
Update a shop section name.

**Parameters:**
- `shop_id` (required): Your shop ID
- `shop_section_id` (required): Section ID
- `title` (required): New title

### 18. delete_shop_section
Remove a shop section.

**Parameters:**
- `shop_id` (required): Your shop ID
- `shop_section_id` (required): Section ID to delete

### 19. update_shop
Update shop information and settings.

**Parameters:**
- `shop_id` (required): Your shop ID
- `title`: Shop title
- `announcement`: Shop announcement message
- `sale_message`: Message to buyers at checkout
- `policy_welcome`: Shop policies welcome message

**Example:**
```json
{
  "shop_id": 12345678,
  "announcement": "Holiday sale - 20% off all items!",
  "sale_message": "Thank you for your purchase!"
}
```

---

## Prompts

The server provides comprehensive prompt templates to help you with common Etsy seller tasks:

### 1. create-listing-guide
Complete guide for creating an optimized Etsy listing with best practices.

**Arguments:**
- `product_type` (required): Type of product (e.g., handmade, vintage, craft supply)

**Provides guidance on:**
- Title creation (140 char max, SEO-optimized)
- Description structure and formatting
- Tags strategy (13 tags with keyword research)
- Pricing calculations (materials, labor, fees)
- Photography checklist

### 2. optimize-listing
Generate SEO-optimized title, tags, and description for existing listings.

**Arguments:**
- `listing_id` (required): The listing to optimize
- `focus_keywords` (optional): Keywords to prioritize

**Generates:**
- SEO-optimized title variations
- Enhanced description with keyword integration
- 13 strategic tags based on search trends
- Competitive analysis framework
- Action items for improvement

### 3. shop-analytics-review
Create comprehensive shop performance analysis template.

**Arguments:**
- `shop_id` (required): Shop to analyze
- `time_period` (optional): Analysis timeframe (e.g., last_month, last_quarter)

**Analyzes:**
- Traffic metrics and conversion rates
- Sales performance and trends
- SEO effectiveness
- Customer insights and behavior
- Actionable recommendations

### 4. product-photography-tips
Tailored product photography guidance for Etsy.

**Arguments:**
- `product_category` (required): Category (jewelry, home decor, clothing, etc.)

**Covers:**
- Equipment recommendations
- Shot list specific to category
- Lighting setup (natural and artificial)
- Styling and composition tips
- Post-processing techniques
- Etsy-specific best practices

### 5. pricing-strategy
Calculate competitive pricing with full cost analysis.

**Arguments:**
- `material_cost` (required): Total material costs
- `time_hours` (required): Hours to create
- `desired_hourly_rate` (optional): Preferred hourly rate (default: $25)

**Calculates:**
- Complete cost breakdown (materials, labor, overhead)
- Etsy fees (transaction, processing, listing)
- Break-even price
- Suggested retail price with profit margin
- Premium positioning options
- Profitability analysis

**Example Usage:**
```
Use prompt "pricing-strategy" with:
- material_cost: 15.50
- time_hours: 3
- desired_hourly_rate: 30
```

---

## Resources

The server provides comprehensive documentation and guides as resources:

### 1. etsy-api-docs
**URI:** `etsy://docs/api`

Complete Etsy Open API v3 reference documentation including:
- Authentication methods (API key, OAuth 2.0)
- Rate limits and best practices
- All endpoint documentation
- Request/response formats
- Error codes and handling

### 2. etsy-seller-handbook
**URI:** `etsy://docs/seller-handbook`

Comprehensive seller guide covering:
- Shop setup and configuration
- Listing optimization strategies
- Product photography best practices
- SEO strategies for Etsy search
- Customer service excellence
- Marketing and growth tactics
- Seasonal planning guide

### 3. etsy-seo-guide
**URI:** `etsy://docs/seo-guide`

Complete SEO optimization guide:
- Understanding Etsy search algorithm
- Keyword research methods and tools
- Title optimization formulas
- Tag strategy (maximizing all 13 tags)
- Description SEO techniques
- Category and attribute selection
- Performance tracking and analytics
- A/B testing strategies
- Common SEO mistakes to avoid
- Quick wins checklist

### 4. etsy-shipping-guide
**URI:** `etsy://docs/shipping`

Everything about shipping on Etsy:
- Setting up shipping profiles
- Domestic and international shipping
- Free shipping strategies
- Carrier comparisons (USPS, UPS, FedEx)
- Packaging best practices and branding
- Tracking and insurance
- Handling shipping issues
- International customs requirements
- Seasonal shipping preparation

### 5. etsy-photography-tips
**URI:** `etsy://docs/photography`

Professional product photography guide:
- Equipment essentials (cameras, lighting, support)
- Technical requirements for Etsy
- Essential shot list (hero, detail, lifestyle, scale)
- Lighting techniques (natural and artificial)
- Styling and composition rules
- Camera settings (smartphone and DSLR)
- Post-processing workflow
- Category-specific tips (jewelry, clothing, home decor, art)
- Mobile photography best practices
- Video content tips

### 6. etsy-fees-calculator
**URI:** `etsy://tools/fees-calculator`

Interactive fees calculator with:
- All Etsy fee structures (listing, transaction, processing, offsite ads)
- Example calculations
- Pricing formulas for profitable pricing
- Tips for managing fee costs
- JSON format for programmatic access

**Example Usage:**
```
Read resource "etsy://docs/seo-guide" for complete SEO strategies
Read resource "etsy://tools/fees-calculator" for pricing calculations
```

---

## Development

### Local Testing with Smithery CLI
```bash
# Interactive playground with all tools
npm run dev
```

### Manual TypeScript Compilation
```bash
npm run compile
```

### Run Directly (stdio mode)
```bash
npm start
```

## API Rate Limiting

The Etsy API has rate limits. Please refer to [Etsy's API documentation](https://developers.etsy.com/documentation/reference) for current rate limit information.

## Architecture

This server uses:
- **@modelcontextprotocol/sdk**: Latest MCP SDK (v1.0.4)
- **TypeScript**: For type safety
- **Axios**: For HTTP requests to Etsy API
- **Node.js**: ES2022 modules

## Project Structure

```
etsy_mcp/
├── src/
│   └── index.ts          # Main server implementation
├── build/                 # Compiled JavaScript output
├── .github/
│   └── copilot-instructions.md
├── smithery.yaml          # Smithery deployment config
├── package.json
├── tsconfig.json
├── README.md             # Main documentation
├── SMITHERY_DEPLOYMENT.md # Smithery deployment guide
├── OAUTH_SETUP.md        # OAuth setup guide
├── QUICK_REFERENCE.md    # Quick reference guide
├── .env.example          # Environment template
└── .gitignore
```

## Error Handling

The server includes comprehensive error handling:
- API errors return detailed error messages with status codes
- Missing API key throws a descriptive error on startup
- All Axios errors are caught and formatted for easy debugging

## Contributing

Contributions are welcome! Please ensure:
1. TypeScript compiles without errors
2. Follow the existing code style
3. Add appropriate error handling
4. Update documentation for new features

## License

MIT

## Resources

- � [Smithery Deployment Guide](./SMITHERY_DEPLOYMENT.md) - Deploy to hosted infrastructure
- �📖 [OAuth Setup Guide](./OAUTH_SETUP.md) - Complete OAuth 2.0 setup instructions
- 📋 [Quick Reference](./QUICK_REFERENCE.md) - Tool categories and common examples
- [Etsy API Documentation](https://developers.etsy.com/documentation)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Smithery Platform](https://smithery.ai)

## Troubleshooting

### "ETSY_API_KEY environment variable is required"
Make sure you've set the `ETSY_API_KEY` in your MCP configuration or environment.

### API Authentication Errors
Verify your API key is valid and has the necessary permissions in the Etsy Developer Portal.

### Connection Issues
Ensure your internet connection is working and you can reach `openapi.etsy.com`.

## Version History

- **1.2.0**: Quality improvements (Smithery score: 69 → 100)
  - ⚙️ **Optional Configuration**: All config fields now optional with sensible defaults (+15pts)
  - 🏷️ **Tool Annotations**: Added readOnlyHint, destructiveHint, and idempotentHint to all 19 tools (+9pts)
  - 🎨 **Server Icon**: Added Etsy-themed SVG icon for better visual identity (+7pts)
  - Zero-config deployment support - server runs without any credentials for demo/testing
  - Environment variable fallbacks for all configuration options
- **1.1.0**: Added prompts and resources
  - 5 comprehensive prompts for seller guidance
  - 6 resource guides (SEO, photography, shipping, fees calculator)
  - Enhanced AI assistant capabilities
- **1.0.0**: Initial release with 19 Etsy API tools
  - 10 read-only tools for searching and viewing
  - 9 shop management tools for creating and updating
  - Full OAuth support for authenticated operations
  - Create, update, and delete listings
  - Manage shop sections and inventory
  - Upload images and update shop info
