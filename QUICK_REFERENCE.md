# Etsy MCP Quick Reference

## Tool Categories

### 🔍 Search & Discovery (API Key Only)
- `search_listings` - Find products by keywords
- `search_shops` - Find shops by name
- `find_shops` - Find shops by location
- `get_trending_listings` - View trending items

### 📦 Listing Information (API Key Only)
- `get_listing` - Get listing details
- `get_listing_inventory` - Check inventory & variations
- `get_listing_images` - Get product images

### 🏪 Shop Information (API Key Only)
- `get_shop` - Get shop details
- `get_shop_listings` - List shop's products
- `get_shop_sections` - Get shop categories

### ✏️ Create & Manage Listings (OAuth Required)
- `create_listing` - Post new product
- `update_listing` - Edit existing product
- `delete_listing` - Remove product
- `update_listing_inventory` - Manage variations/SKUs
- `upload_listing_image` - Add product images

### 🛠️ Shop Management (OAuth Required)
- `update_shop` - Edit shop info & announcements
- `create_shop_section` - Add category
- `update_shop_section` - Edit category
- `delete_shop_section` - Remove category

## Common Use Cases

### Create a New Listing
```json
{
  "tool": "create_listing",
  "shop_id": 12345678,
  "title": "Handmade Ceramic Mug",
  "description": "Beautiful blue glaze...",
  "price": 25.99,
  "quantity": 10,
  "who_made": "i_did",
  "when_made": "made_to_order",
  "taxonomy_id": 1234,
  "tags": ["ceramic", "mug", "handmade"]
}
```

### Update Listing Price
```json
{
  "tool": "update_listing",
  "shop_id": 12345678,
  "listing_id": 987654321,
  "price": 29.99
}
```

### Create Shop Section
```json
{
  "tool": "create_shop_section",
  "shop_id": 12345678,
  "title": "Holiday Collection"
}
```

### Update Shop Announcement
```json
{
  "tool": "update_shop",
  "shop_id": 12345678,
  "announcement": "20% off sale this weekend!"
}
```

### Search for Listings
```json
{
  "tool": "search_listings",
  "keywords": "handmade jewelry",
  "limit": 10,
  "sort_on": "price",
  "sort_order": "asc",
  "min_price": 10,
  "max_price": 50
}
```

## Required Scopes

| Scope | Permissions |
|-------|-------------|
| `listings_r` | Read listings (search, view) |
| `listings_w` | Create/update/delete listings |
| `shops_r` | Read shop information |
| `shops_w` | Update shop settings |
| `transactions_r` | Read orders |
| `transactions_w` | Update orders |

## Environment Variables

```bash
# Required for all operations
ETSY_API_KEY=your_keystring

# Optional (speeds up shop operations)
ETSY_SHOP_ID=your_shop_id

# Required for write operations
ETSY_ACCESS_TOKEN=your_oauth_token
ETSY_REFRESH_TOKEN=your_refresh_token
```

## Taxonomy IDs (Common Categories)

Find full list at: https://www.etsy.com/sellers/handbook/article/taxonomy-ids/22665229190

| Category | ID |
|----------|-----|
| Jewelry | 69150425 |
| Clothing | 69150433 |
| Home & Living | 1063498 |
| Art & Collectibles | 69150467 |
| Craft Supplies & Tools | 562 |
| Vintage | 69150393 |
| Toys & Games | 1063340 |
| Books, Movies & Music | 267 |

## Who Made Options

- `i_did` - I made it myself
- `someone_else` - A member of my shop
- `collective` - A member of a different company/collective

## When Made Options

- `made_to_order` - Made to order
- `2020_2023` - 2020-2023
- `2010_2019` - 2010-2019
- `2000_2009` - 2000-2009
- `1990s` - 1990s
- `1980s` - 1980s
- `before_1980` - Before 1980
- `1970s` - 1970s

## Rate Limits

Etsy API has rate limits per app:
- **Open API (public endpoints)**: Higher limits
- **OAuth endpoints**: More strict limits
- Typical: 10,000 requests per day

## Error Handling

The server returns errors in this format:
```json
{
  "error": "Error message or details",
  "status": 404
}
```

Common errors:
- **401**: Missing or invalid API key/token
- **403**: Insufficient permissions
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Etsy server error

## Tips

1. **Cache Shop ID**: Set `ETSY_SHOP_ID` to avoid looking it up
2. **Batch Operations**: Use pagination for large datasets
3. **Token Refresh**: Access tokens expire hourly
4. **Test First**: Use test shop/sandbox before production
5. **Monitor Limits**: Track API usage to avoid rate limits

## Support

- [Etsy API Documentation](https://developers.etsy.com/documentation)
- [Etsy Developer Forums](https://community.etsy.com/t5/Developer-APIs/bd-p/developer_apis)
- [MCP Documentation](https://modelcontextprotocol.io)
