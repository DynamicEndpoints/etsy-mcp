# Prompts and Resources Guide

This document provides a comprehensive overview of the prompts and resources available in the Etsy MCP Server.

## Overview

Version 1.1.0 adds two powerful MCP capabilities:
- **5 Smart Prompts**: AI-assisted guidance for common Etsy seller tasks
- **6 Resource Guides**: Comprehensive documentation and best practices

## Prompts

Prompts are interactive templates that help AI assistants provide tailored guidance for Etsy sellers. They use the Model Context Protocol's prompt system to deliver context-aware advice.

### 1. Create Listing Guide

**Name:** `create-listing-guide`  
**Arguments:**
- `product_type` (required): Type of product (handmade, vintage, craft supply, etc.)

**What it provides:**
- Step-by-step listing creation framework
- Title optimization (140 character limit, SEO best practices)
- Description structure with proven templates
- Tags strategy (how to use all 13 tags effectively)
- Pricing calculations including materials, labor, and fees
- Photography checklist for maximum impact

**Use case:** Starting from scratch with a new product listing

---

### 2. Optimize Listing

**Name:** `optimize-listing`  
**Arguments:**
- `listing_id` (required): The listing to optimize
- `focus_keywords` (optional): Specific keywords to target

**What it provides:**
- SEO-optimized title recommendations
- Enhanced description with strategic keyword placement
- 13 strategic tags based on search trends
- Competitive analysis framework
- Prioritized action items for quick wins
- A/B testing suggestions

**Use case:** Improving an existing listing's performance and search visibility

---

### 3. Shop Analytics Review

**Name:** `shop-analytics-review`  
**Arguments:**
- `shop_id` (required): Shop to analyze
- `time_period` (optional): Timeframe (last_month, last_quarter, etc.)

**What it provides:**
- Traffic metrics analysis (sources, conversion rates, bounce rates)
- Sales performance breakdown
- SEO effectiveness evaluation
- Customer insights and behavior patterns
- Actionable recommendations for improvement
- Framework for using MCP tools to gather data

**Use case:** Regular shop performance reviews and strategic planning

---

### 4. Product Photography Tips

**Name:** `product-photography-tips`  
**Arguments:**
- `product_category` (required): jewelry, home decor, clothing, art, etc.

**What it provides:**
- Equipment recommendations (camera, lighting, accessories)
- Category-specific shot list (hero, detail, lifestyle, scale)
- Lighting setup guides (natural and artificial)
- Technical requirements (resolution, format, file size)
- Styling and composition tips
- Post-processing workflow
- Etsy-specific best practices (thumbnail optimization, mobile-first)

**Use case:** Improving product photography quality and consistency

---

### 5. Pricing Strategy

**Name:** `pricing-strategy`  
**Arguments:**
- `material_cost` (required): Total cost of materials
- `time_hours` (required): Hours spent creating the product
- `desired_hourly_rate` (optional): Preferred hourly rate (default: $25/hour)

**What it provides:**
- Complete cost breakdown (materials + labor + overhead)
- Etsy fees calculation (transaction + processing + listing)
- Break-even price
- Suggested retail price with 50% profit margin
- Premium positioning options
- Profitability analysis with monthly projections
- Psychological pricing tips
- Competitor analysis suggestions

**Use case:** Setting profitable prices that cover all costs and fees

**Example:**
```
material_cost: 15.50
time_hours: 3
desired_hourly_rate: 30

Result:
- Total Cost: $109.50
- Break-Even: $119.91
- Suggested Retail: $179.87 (50% profit margin)
```

---

## Resources

Resources are static documents providing comprehensive guides and references. They can be read by AI assistants to provide informed answers.

### 1. Etsy API Documentation

**URI:** `etsy://docs/api`  
**Format:** text/plain

**Contents:**
- Complete Etsy Open API v3 reference
- Base URL and authentication methods
- Rate limits and best practices
- All major endpoints documentation
- Request/response format examples
- Error codes and handling
- Common parameters reference

**Use case:** Understanding API capabilities and integration details

---

### 2. Etsy Seller Handbook

**URI:** `etsy://docs/seller-handbook`  
**Format:** text/plain

**Contents:**
- Shop setup and configuration guide
- Listing optimization strategies
- Product photography best practices
- SEO strategies for Etsy search
- Customer service excellence
- Marketing and promotional tactics
- Growth strategies and scaling
- Seasonal planning guide
- Resource links (forums, teams, newsletter)

**Use case:** Comprehensive seller education and best practices

---

### 3. Etsy SEO Guide

**URI:** `etsy://docs/seo-guide`  
**Format:** text/plain

**Contents:**
- Understanding Etsy's search algorithm
- Keyword research methods and tools
- Title optimization formulas and examples
- Tag strategy (maximizing all 13 tags)
- Description SEO techniques
- Categories and attributes optimization
- Performance tracking metrics
- Advanced strategies (A/B testing, seasonal optimization)
- Common SEO mistakes to avoid
- Quick wins checklist

**Use case:** Mastering Etsy search optimization for better visibility

---

### 4. Etsy Shipping Guide

**URI:** `etsy://docs/shipping`  
**Format:** text/plain

**Contents:**
- Shipping strategy and profile setup
- Pricing models (calculated, fixed, free, combined)
- Domestic carrier comparisons (USPS, UPS, FedEx)
- International shipping considerations
- Free shipping strategies and implementation
- Processing and handling best practices
- Packaging tips (protection, branding, sustainability)
- Tracking and insurance guidelines
- Handling shipping issues (lost, damaged, delayed)
- International customs requirements
- Seasonal shipping preparation

**Use case:** Setting up professional shipping operations

---

### 5. Product Photography Tips

**URI:** `etsy://docs/photography`  
**Format:** text/plain

**Contents:**
- Equipment essentials (cameras, lighting, support)
- Etsy photo requirements (resolution, format, file size)
- Essential shot list (hero, detail, lifestyle, scale, packaging)
- Lighting techniques (natural and artificial setups)
- Styling and composition rules
- Camera settings (smartphone and DSLR)
- Post-processing workflow
- Category-specific tips (jewelry, clothing, home decor, art)
- Mobile photography best practices
- Video content recommendations
- Common mistakes to avoid
- Workflow efficiency tips

**Use case:** Creating professional product photos that sell

---

### 6. Etsy Fees Calculator

**URI:** `etsy://tools/fees-calculator`  
**Format:** application/json

**Contents:**
- All Etsy fee structures:
  - Listing fee: $0.20
  - Transaction fee: 6.5%
  - Payment processing: 3% + $0.25
  - Offsite ads: 12% (or 15% for high-volume sellers)
  - Currency conversion: 2.5%
- Example calculations with $50 product
- Pricing formulas for profitability
- Tips for managing fee costs
- JSON format for programmatic access

**Use case:** Understanding and calculating Etsy fees for accurate pricing

---

## Usage Examples

### With Claude Desktop

**Using a Prompt:**
```
User: "Help me create a listing for my handmade ceramic mugs"
AI: Uses "create-listing-guide" prompt with product_type="ceramic"
```

**Using a Resource:**
```
User: "What are the best practices for Etsy SEO?"
AI: Reads "etsy://docs/seo-guide" resource and provides tailored advice
```

**Combined Usage:**
```
User: "I need to price my jewelry that costs $20 in materials and takes 4 hours"
AI: 
1. Uses "pricing-strategy" prompt with material_cost=20, time_hours=4
2. Reads "etsy://tools/fees-calculator" for detailed fee breakdown
3. Provides comprehensive pricing recommendation
```

### With Smithery Deployment

Once deployed to Smithery, all prompts and resources are automatically available to connected AI assistants. The AI can seamlessly access these to provide expert Etsy seller guidance.

---

## Technical Implementation

### Prompts
- Implemented using MCP's `ListPromptsRequestSchema` and `GetPromptRequestSchema`
- Return structured `GetPromptResult` with contextual messages
- Support parameterized templates with required/optional arguments
- Dynamic content generation based on input parameters

### Resources
- Implemented using MCP's `ListResourcesRequestSchema` and `ReadResourceRequestSchema`
- Return `ReadResourceResult` with formatted content
- Support multiple MIME types (text/plain, application/json)
- URI-based addressing scheme (`etsy://docs/*`, `etsy://tools/*`)

---

## Benefits for AI Assistants

1. **Consistency**: Pre-built prompts ensure consistent, high-quality guidance
2. **Expertise**: Resources embed professional Etsy seller knowledge
3. **Context**: Prompts provide structured frameworks for complex tasks
4. **Efficiency**: No need to search external sources for Etsy best practices
5. **Accuracy**: Calculations (pricing, fees) are precise and current
6. **Comprehensiveness**: Covers all major aspects of Etsy selling

---

## Future Enhancements

Potential additions for future versions:

**Prompts:**
- `marketing-campaign`: Social media and email marketing templates
- `customer-response`: Professional response templates for common scenarios
- `holiday-prep`: Seasonal preparation checklist and strategy
- `trend-analysis`: Identify trending products and opportunities

**Resources:**
- `etsy://docs/legal`: Policies, trademarks, intellectual property
- `etsy://docs/taxes`: Tax obligations for Etsy sellers
- `etsy://docs/scaling`: Hiring, automation, wholesale strategies
- `etsy://tools/keyword-analyzer`: Real-time keyword research tool

---

## Contributing

Have ideas for new prompts or resources? Contributions are welcome! Please ensure:
- Prompts provide actionable, step-by-step guidance
- Resources are comprehensive and well-formatted
- Content is accurate and up-to-date with Etsy policies
- Examples are clear and practical

---

## Version History

- **v1.1.0** (Current): Initial prompts and resources implementation
  - 5 comprehensive prompts
  - 6 detailed resource guides
  - Full MCP protocol compliance

---

## Questions?

For more information:
- See [README.md](./README.md) for complete server documentation
- See [SMITHERY_DEPLOYMENT.md](./SMITHERY_DEPLOYMENT.md) for deployment instructions
- Check [Model Context Protocol docs](https://modelcontextprotocol.io) for MCP standards
