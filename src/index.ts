#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Prompt,
  Resource,
  GetPromptResult,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// Etsy API Configuration
const ETSY_API_BASE_URL = 'https://openapi.etsy.com/v3';

interface EtsyConfig {
  apiKey: string;
  shopId?: string;
  accessToken?: string;
}

// Configuration schema for Smithery
export const configSchema = z.object({
  apiKey: z.string().describe('Your Etsy API key (Keystring) from the Etsy Developer Portal'),
  shopId: z.string().optional().describe('Your Etsy shop ID (optional, for faster shop operations)'),
  accessToken: z.string().optional().describe('OAuth access token for shop management features (optional, required for write operations)'),
});

class EtsyMCPServer {
  private server: Server;
  private axiosInstance: AxiosInstance;
  private config: EtsyConfig;

  constructor(config: EtsyConfig) {
    this.config = config;

    const headers: any = {
      'x-api-key': this.config.apiKey,
    };

    // Add OAuth token if available for authenticated requests
    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    this.axiosInstance = axios.create({
      baseURL: ETSY_API_BASE_URL,
      headers,
    });

    this.server = new Server(
      {
        name: 'etsy-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_listings':
            return await this.searchListings(args);
          case 'get_listing':
            return await this.getListing(args);
          case 'get_shop':
            return await this.getShop(args);
          case 'get_shop_listings':
            return await this.getShopListings(args);
          case 'search_shops':
            return await this.searchShops(args);
          case 'get_listing_inventory':
            return await this.getListingInventory(args);
          case 'get_listing_images':
            return await this.getListingImages(args);
          case 'get_shop_sections':
            return await this.getShopSections(args);
          case 'get_trending_listings':
            return await this.getTrendingListings(args);
          case 'find_shops':
            return await this.findShops(args);
          // Shop Management Tools
          case 'create_listing':
            return await this.createListing(args);
          case 'update_listing':
            return await this.updateListing(args);
          case 'delete_listing':
            return await this.deleteListing(args);
          case 'update_listing_inventory':
            return await this.updateListingInventory(args);
          case 'upload_listing_image':
            return await this.uploadListingImage(args);
          case 'create_shop_section':
            return await this.createShopSection(args);
          case 'update_shop_section':
            return await this.updateShopSection(args);
          case 'delete_shop_section':
            return await this.deleteShopSection(args);
          case 'update_shop':
            return await this.updateShop(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: error.response?.data || error.message,
                    status: error.response?.status,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
        throw error;
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: this.getPrompts(),
    }));

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.getPrompt(name, args);
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.getResources(),
    }));

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      return await this.readResource(uri);
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'search_listings',
        description:
          'Search for active Etsy listings. Supports keyword search with various filters.',
        inputSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'string',
              description: 'Search keywords for finding listings',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25, max: 100)',
              default: 25,
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip (for pagination)',
              default: 0,
            },
            min_price: {
              type: 'number',
              description: 'Minimum price in the shop currency',
            },
            max_price: {
              type: 'number',
              description: 'Maximum price in the shop currency',
            },
            sort_on: {
              type: 'string',
              enum: ['created', 'price', 'updated', 'score'],
              description: 'Field to sort results on',
            },
            sort_order: {
              type: 'string',
              enum: ['asc', 'desc', 'ascending', 'descending'],
              description: 'Sort order',
            },
          },
          required: ['keywords'],
        },
      },
      {
        name: 'get_listing',
        description: 'Get detailed information about a specific Etsy listing by its ID.',
        inputSchema: {
          type: 'object',
          properties: {
            listing_id: {
              type: 'number',
              description: 'The numeric ID of the listing',
            },
            includes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['Shop', 'Images', 'User', 'Translations', 'Inventory'],
              },
              description: 'Additional data to include in the response',
            },
          },
          required: ['listing_id'],
        },
      },
      {
        name: 'get_shop',
        description: 'Get information about an Etsy shop by shop ID.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'The numeric ID of the shop',
            },
          },
          required: ['shop_id'],
        },
      },
      {
        name: 'get_shop_listings',
        description: 'Get all active listings from a specific shop.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'The numeric ID of the shop',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25, max: 100)',
              default: 25,
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip (for pagination)',
              default: 0,
            },
            state: {
              type: 'string',
              enum: ['active', 'inactive', 'sold_out', 'draft', 'expired'],
              description: 'Filter by listing state (default: active)',
              default: 'active',
            },
          },
          required: ['shop_id'],
        },
      },
      {
        name: 'search_shops',
        description: 'Search for Etsy shops by shop name.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_name: {
              type: 'string',
              description: 'The shop name to search for',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25, max: 100)',
              default: 25,
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip (for pagination)',
              default: 0,
            },
          },
          required: ['shop_name'],
        },
      },
      {
        name: 'get_listing_inventory',
        description:
          'Get inventory information for a listing, including available quantities and variations.',
        inputSchema: {
          type: 'object',
          properties: {
            listing_id: {
              type: 'number',
              description: 'The numeric ID of the listing',
            },
          },
          required: ['listing_id'],
        },
      },
      {
        name: 'get_listing_images',
        description: 'Get all images associated with a specific listing.',
        inputSchema: {
          type: 'object',
          properties: {
            listing_id: {
              type: 'number',
              description: 'The numeric ID of the listing',
            },
          },
          required: ['listing_id'],
        },
      },
      {
        name: 'get_shop_sections',
        description: 'Get all sections/categories for a specific shop.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'The numeric ID of the shop',
            },
          },
          required: ['shop_id'],
        },
      },
      {
        name: 'get_trending_listings',
        description: 'Get current trending listings on Etsy.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25, max: 100)',
              default: 25,
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip (for pagination)',
              default: 0,
            },
          },
        },
      },
      {
        name: 'find_shops',
        description: 'Find shops by location or other criteria.',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location to search for shops',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25, max: 100)',
              default: 25,
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip (for pagination)',
              default: 0,
            },
          },
        },
      },
      // Shop Management Tools (require OAuth access token)
      {
        name: 'create_listing',
        description:
          'Create a new listing in your Etsy shop. Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'Your shop ID',
            },
            quantity: {
              type: 'number',
              description: 'Available quantity',
            },
            title: {
              type: 'string',
              description: 'Listing title (max 140 characters)',
            },
            description: {
              type: 'string',
              description: 'Item description',
            },
            price: {
              type: 'number',
              description: 'Price in shop currency',
            },
            who_made: {
              type: 'string',
              enum: ['i_did', 'someone_else', 'collective'],
              description: 'Who made this item',
            },
            when_made: {
              type: 'string',
              description:
                'When was it made (e.g., made_to_order, 2020_2023, 2010_2019)',
            },
            taxonomy_id: {
              type: 'number',
              description: 'Category taxonomy ID',
            },
            shipping_profile_id: {
              type: 'number',
              description: 'Shipping profile ID (optional)',
            },
            shop_section_id: {
              type: 'number',
              description: 'Shop section ID (optional)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tags (max 13)',
            },
          },
          required: [
            'shop_id',
            'quantity',
            'title',
            'description',
            'price',
            'who_made',
            'when_made',
            'taxonomy_id',
          ],
        },
      },
      {
        name: 'update_listing',
        description: 'Update an existing listing. Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'Your shop ID',
            },
            listing_id: {
              type: 'number',
              description: 'Listing ID to update',
            },
            title: {
              type: 'string',
              description: 'New title',
            },
            description: {
              type: 'string',
              description: 'New description',
            },
            price: {
              type: 'number',
              description: 'New price',
            },
            quantity: {
              type: 'number',
              description: 'New quantity',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'New tags',
            },
            shop_section_id: {
              type: 'number',
              description: 'Shop section ID',
            },
          },
          required: ['shop_id', 'listing_id'],
        },
      },
      {
        name: 'delete_listing',
        description:
          'Delete a listing from your shop. Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            listing_id: {
              type: 'number',
              description: 'Listing ID to delete',
            },
          },
          required: ['listing_id'],
        },
      },
      {
        name: 'update_listing_inventory',
        description:
          'Update inventory for a listing (quantities, prices, SKUs). Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            listing_id: {
              type: 'number',
              description: 'Listing ID',
            },
            products: {
              type: 'array',
              description: 'Array of product variations with offerings',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string' },
                  property_values: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        property_id: { type: 'number' },
                        property_name: { type: 'string' },
                        scale_id: { type: 'number' },
                        value_ids: {
                          type: 'array',
                          items: { type: 'number' },
                        },
                        values: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                      },
                    },
                  },
                  offerings: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        price: { type: 'number' },
                        quantity: { type: 'number' },
                        is_enabled: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
            price_on_property: {
              type: 'array',
              items: { type: 'number' },
              description: 'Property IDs that affect price',
            },
            quantity_on_property: {
              type: 'array',
              items: { type: 'number' },
              description: 'Property IDs that affect quantity',
            },
            sku_on_property: {
              type: 'array',
              items: { type: 'number' },
              description: 'Property IDs that affect SKU',
            },
          },
          required: ['listing_id', 'products'],
        },
      },
      {
        name: 'upload_listing_image',
        description:
          'Upload an image to a listing. Requires OAuth access token and image file.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'Your shop ID',
            },
            listing_id: {
              type: 'number',
              description: 'Listing ID',
            },
            image_url: {
              type: 'string',
              description: 'URL of the image to upload',
            },
            rank: {
              type: 'number',
              description: 'Display order (1 = primary image)',
            },
            alt_text: {
              type: 'string',
              description: 'Alternative text for accessibility',
            },
          },
          required: ['shop_id', 'listing_id', 'image_url'],
        },
      },
      {
        name: 'create_shop_section',
        description:
          'Create a new shop section/category. Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'Your shop ID',
            },
            title: {
              type: 'string',
              description: 'Section title',
            },
          },
          required: ['shop_id', 'title'],
        },
      },
      {
        name: 'update_shop_section',
        description: 'Update a shop section. Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'Your shop ID',
            },
            shop_section_id: {
              type: 'number',
              description: 'Section ID to update',
            },
            title: {
              type: 'string',
              description: 'New section title',
            },
          },
          required: ['shop_id', 'shop_section_id', 'title'],
        },
      },
      {
        name: 'delete_shop_section',
        description: 'Delete a shop section. Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'Your shop ID',
            },
            shop_section_id: {
              type: 'number',
              description: 'Section ID to delete',
            },
          },
          required: ['shop_id', 'shop_section_id'],
        },
      },
      {
        name: 'update_shop',
        description:
          'Update shop information (title, announcement, etc.). Requires OAuth access token.',
        inputSchema: {
          type: 'object',
          properties: {
            shop_id: {
              type: 'number',
              description: 'Your shop ID',
            },
            title: {
              type: 'string',
              description: 'Shop title',
            },
            announcement: {
              type: 'string',
              description: 'Shop announcement message',
            },
            sale_message: {
              type: 'string',
              description: 'Message to buyers at checkout',
            },
            policy_welcome: {
              type: 'string',
              description: 'Shop policies welcome message',
            },
          },
          required: ['shop_id'],
        },
      },
    ];
  }

  private async searchListings(args: any) {
    const params: any = {
      keywords: args.keywords,
      limit: args.limit || 25,
      offset: args.offset || 0,
    };

    if (args.min_price) params.min_price = args.min_price;
    if (args.max_price) params.max_price = args.max_price;
    if (args.sort_on) params.sort_on = args.sort_on;
    if (args.sort_order) params.sort_order = args.sort_order;

    const response = await this.axiosInstance.get('/application/listings/active', {
      params,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getListing(args: any) {
    const includes = args.includes?.join(',');
    const params = includes ? { includes } : {};

    const response = await this.axiosInstance.get(
      `/application/listings/${args.listing_id}`,
      { params }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getShop(args: any) {
    const response = await this.axiosInstance.get(`/application/shops/${args.shop_id}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getShopListings(args: any) {
    const params = {
      limit: args.limit || 25,
      offset: args.offset || 0,
      state: args.state || 'active',
    };

    const response = await this.axiosInstance.get(
      `/application/shops/${args.shop_id}/listings`,
      { params }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async searchShops(args: any) {
    const params = {
      shop_name: args.shop_name,
      limit: args.limit || 25,
      offset: args.offset || 0,
    };

    const response = await this.axiosInstance.get('/application/shops', { params });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getListingInventory(args: any) {
    const response = await this.axiosInstance.get(
      `/application/listings/${args.listing_id}/inventory`
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getListingImages(args: any) {
    const response = await this.axiosInstance.get(
      `/application/listings/${args.listing_id}/images`
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getShopSections(args: any) {
    const response = await this.axiosInstance.get(
      `/application/shops/${args.shop_id}/sections`
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getTrendingListings(args: any) {
    const params = {
      limit: args.limit || 25,
      offset: args.offset || 0,
    };

    const response = await this.axiosInstance.get('/application/listings/trending', {
      params,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async findShops(args: any) {
    const params: any = {
      limit: args.limit || 25,
      offset: args.offset || 0,
    };

    if (args.location) params.location = args.location;

    const response = await this.axiosInstance.get('/application/shops', { params });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  // Shop Management Methods (require OAuth)
  private async createListing(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const data: any = {
      quantity: args.quantity,
      title: args.title,
      description: args.description,
      price: args.price,
      who_made: args.who_made,
      when_made: args.when_made,
      taxonomy_id: args.taxonomy_id,
    };

    if (args.shipping_profile_id) data.shipping_profile_id = args.shipping_profile_id;
    if (args.shop_section_id) data.shop_section_id = args.shop_section_id;
    if (args.tags) data.tags = args.tags;

    const response = await this.axiosInstance.post(
      `/application/shops/${args.shop_id}/listings`,
      data
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async updateListing(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const data: any = {};
    if (args.title) data.title = args.title;
    if (args.description) data.description = args.description;
    if (args.price) data.price = args.price;
    if (args.quantity) data.quantity = args.quantity;
    if (args.tags) data.tags = args.tags;
    if (args.shop_section_id !== undefined) data.shop_section_id = args.shop_section_id;

    const response = await this.axiosInstance.patch(
      `/application/shops/${args.shop_id}/listings/${args.listing_id}`,
      data
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async deleteListing(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const response = await this.axiosInstance.delete(
      `/application/listings/${args.listing_id}`
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: true, message: 'Listing deleted successfully' },
            null,
            2
          ),
        },
      ],
    };
  }

  private async updateListingInventory(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const data: any = {
      products: args.products,
    };

    if (args.price_on_property) data.price_on_property = args.price_on_property;
    if (args.quantity_on_property) data.quantity_on_property = args.quantity_on_property;
    if (args.sku_on_property) data.sku_on_property = args.sku_on_property;

    const response = await this.axiosInstance.put(
      `/application/listings/${args.listing_id}/inventory`,
      data
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async uploadListingImage(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Note: Etsy API requires multipart/form-data for image upload
    // This is a simplified version - actual implementation needs form-data handling
    const data: any = {
      image: args.image_url,
    };

    if (args.rank) data.rank = args.rank;
    if (args.alt_text) data.alt_text = args.alt_text;

    const response = await this.axiosInstance.post(
      `/application/shops/${args.shop_id}/listings/${args.listing_id}/images`,
      data
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async createShopSection(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const response = await this.axiosInstance.post(
      `/application/shops/${args.shop_id}/sections`,
      { title: args.title }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async updateShopSection(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const response = await this.axiosInstance.put(
      `/application/shops/${args.shop_id}/sections/${args.shop_section_id}`,
      { title: args.title }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async deleteShopSection(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const response = await this.axiosInstance.delete(
      `/application/shops/${args.shop_id}/sections/${args.shop_section_id}`
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: true, message: 'Shop section deleted successfully' },
            null,
            2
          ),
        },
      ],
    };
  }

  private async updateShop(args: any) {
    if (!this.config.accessToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'OAuth access token required. Set ETSY_ACCESS_TOKEN environment variable.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const data: any = {};
    if (args.title) data.title = args.title;
    if (args.announcement) data.announcement = args.announcement;
    if (args.sale_message) data.sale_message = args.sale_message;
    if (args.policy_welcome) data.policy_welcome = args.policy_welcome;

    const response = await this.axiosInstance.put(
      `/application/shops/${args.shop_id}`,
      data
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  // Prompts functionality
  private getPrompts(): Prompt[] {
    return [
      {
        name: 'create-listing-guide',
        title: 'Create Listing Guide',
        description: 'Guide for creating a complete Etsy listing with best practices',
        arguments: [
          {
            name: 'product_type',
            description: 'Type of product to list (e.g., handmade, vintage, craft supply)',
            required: true,
          },
        ],
      },
      {
        name: 'optimize-listing',
        title: 'Optimize Listing',
        description: 'Generate SEO-optimized title, tags, and description for a listing',
        arguments: [
          {
            name: 'listing_id',
            description: 'The ID of the listing to optimize',
            required: true,
          },
          {
            name: 'focus_keywords',
            description: 'Keywords to focus on for SEO',
            required: false,
          },
        ],
      },
      {
        name: 'shop-analytics-review',
        title: 'Shop Analytics Review',
        description: 'Create a comprehensive shop performance review template',
        arguments: [
          {
            name: 'shop_id',
            description: 'The shop ID to analyze',
            required: true,
          },
          {
            name: 'time_period',
            description: 'Time period for analysis (e.g., last_month, last_quarter)',
            required: false,
          },
        ],
      },
      {
        name: 'product-photography-tips',
        title: 'Product Photography Tips',
        description: 'Get tailored product photography guidance for Etsy',
        arguments: [
          {
            name: 'product_category',
            description: 'Category of product (e.g., jewelry, home decor, clothing)',
            required: true,
          },
        ],
      },
      {
        name: 'pricing-strategy',
        title: 'Pricing Strategy',
        description: 'Calculate competitive pricing for Etsy listings',
        arguments: [
          {
            name: 'material_cost',
            description: 'Total cost of materials',
            required: true,
          },
          {
            name: 'time_hours',
            description: 'Hours spent creating the product',
            required: true,
          },
          {
            name: 'desired_hourly_rate',
            description: 'Desired hourly rate for labor',
            required: false,
          },
        ],
      },
    ];
  }

  private async getPrompt(name: string, args?: Record<string, string>): Promise<GetPromptResult> {
    switch (name) {
      case 'create-listing-guide':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me create a compelling Etsy listing for a ${args?.product_type || 'handmade'} product. Please guide me through:

1. **Title Creation** (max 140 characters):
   - Include key search terms
   - Be specific and descriptive
   - Follow format: [What it is] | [Key feature] | [Use case]

2. **Description Structure**:
   - Opening hook (2-3 sentences)
   - Key features and benefits (bullet points)
   - Materials and dimensions
   - Care instructions
   - Shipping and policies

3. **Tags Strategy** (13 tags):
   - Mix of broad and specific terms
   - Include long-tail keywords
   - Consider seasonal trends

4. **Pricing Considerations**:
   - Material costs + labor + overhead
   - Competitive analysis
   - Etsy fees (6.5% transaction + 3% + $0.25 processing)

5. **Photos Checklist**:
   - Main photo: white background, product centered
   - Lifestyle photos showing scale/use
   - Detail shots of craftsmanship
   - Size comparison images

Please help me optimize each section for maximum visibility and conversions.`,
              },
            },
          ],
        };

      case 'optimize-listing':
        const listingId = args?.listing_id;
        const keywords = args?.focus_keywords || 'handmade, unique, quality';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Analyze and optimize Etsy listing ${listingId} with focus on these keywords: ${keywords}

Please provide:

1. **SEO-Optimized Title**:
   - Incorporate keywords: ${keywords}
   - Stay under 140 characters
   - Front-load important terms

2. **Enhanced Description**:
   - Keyword-rich opening paragraph
   - Scannable bullet points
   - Answer common customer questions
   - Include size, material, and shipping info

3. **Strategic Tags** (13 recommendations):
   - High-volume search terms
   - Niche-specific keywords
   - Long-tail variations
   - Seasonal opportunities

4. **Competitive Analysis**:
   - Similar listings comparison
   - Price positioning
   - Unique selling points

5. **Action Items**:
   - Quick wins for immediate improvement
   - Long-term optimization strategies
   - A/B testing suggestions`,
              },
            },
          ],
        };

      case 'shop-analytics-review':
        const shopId = args?.shop_id;
        const period = args?.time_period || 'last_month';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Create a comprehensive analytics review for Etsy shop ${shopId} covering ${period}.

Analysis Framework:

1. **Traffic Metrics**:
   - Total visits and sources
   - Conversion rate trends
   - Bounce rate analysis
   - Top-performing listings

2. **Sales Performance**:
   - Revenue and order volume
   - Average order value
   - Best-selling products
   - Seasonal patterns

3. **SEO Performance**:
   - Top search terms driving traffic
   - Listing ranking improvements/declines
   - Click-through rates
   - Tag effectiveness

4. **Customer Insights**:
   - Geographic distribution
   - Repeat customer rate
   - Review sentiment analysis
   - Cart abandonment rate

5. **Recommendations**:
   - Underperforming listings to optimize
   - Inventory adjustments
   - Marketing opportunities
   - Pricing strategy review

Please use the available MCP tools to gather data and provide actionable insights.`,
              },
            },
          ],
        };

      case 'product-photography-tips':
        const category = args?.product_category || 'general products';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Provide comprehensive product photography guidance for ${category} on Etsy.

**Photography Essentials:**

1. **Equipment Setup**:
   - Camera: DSLR, mirrorless, or modern smartphone
   - Lighting: Natural light or softbox setup
   - Background: White sweep or lifestyle setting
   - Tripod for consistency

2. **Shot List for ${category}**:
   - Hero shot (main listing photo)
   - Scale/size reference shots
   - Detail and texture closeups
   - Lifestyle/in-use photos
   - Packaging presentation
   - Multiple angles (360° view)

3. **Technical Requirements**:
   - Resolution: Minimum 2000px on longest side
   - Format: JPG for best compatibility
   - File size: Under 1MB for fast loading
   - Aspect ratio: Square (1:1) works best

4. **Styling Tips for ${category}**:
   - Props that complement without distracting
   - Consistent brand aesthetic
   - Color harmony and contrast
   - Storytelling through composition

5. **Post-Processing**:
   - Brightness and contrast adjustment
   - Color correction for accuracy
   - Background cleanup
   - Watermarking considerations

6. **Etsy-Specific Best Practices**:
   - First photo determines thumbnail
   - Mobile optimization crucial (70% of traffic)
   - Use all 10 image slots
   - Video recommended for engagement`,
              },
            },
          ],
        };

      case 'pricing-strategy':
        const materialCost = parseFloat(args?.material_cost || '0');
        const timeHours = parseFloat(args?.time_hours || '0');
        const hourlyRate = parseFloat(args?.desired_hourly_rate || '25');
        
        const laborCost = timeHours * hourlyRate;
        const subtotal = materialCost + laborCost;
        const overhead = subtotal * 0.15; // 15% overhead
        const totalCost = subtotal + overhead;
        const etsyFees = totalCost * 0.095; // 6.5% transaction + ~3% processing
        const minimumPrice = totalCost + etsyFees;
        const suggestedRetail = minimumPrice * 1.5; // 50% profit margin
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Pricing Analysis for Your Etsy Product:

**Cost Breakdown:**
- Materials: $${materialCost.toFixed(2)}
- Labor (${timeHours}h × $${hourlyRate}/h): $${laborCost.toFixed(2)}
- Overhead (15%): $${overhead.toFixed(2)}
- **Total Cost: $${totalCost.toFixed(2)}**

**Etsy Fees:**
- Transaction fee (6.5%): $${(totalCost * 0.065).toFixed(2)}
- Processing fee (~3%): $${(totalCost * 0.03).toFixed(2)}
- Listing fee: $0.20
- **Total Fees: $${(etsyFees + 0.20).toFixed(2)}**

**Pricing Recommendations:**

1. **Break-Even Price:** $${minimumPrice.toFixed(2)}
   - Covers all costs and fees
   - No profit margin

2. **Suggested Retail Price:** $${suggestedRetail.toFixed(2)}
   - Includes 50% profit margin
   - Competitive positioning
   - Room for sales/promotions

3. **Premium Positioning:** $${(suggestedRetail * 1.3).toFixed(2)}
   - Higher perceived value
   - Artisan/luxury market
   - Custom/made-to-order

**Pricing Strategy Tips:**

• **Psychological Pricing:** Consider ending prices in .95 or .99
• **Competitor Analysis:** Research 10-15 similar listings
• **Volume Discounts:** Offer tiered pricing for multiple purchases
• **Seasonal Adjustments:** Premium during peak seasons
• **Bundle Opportunities:** Create product sets for higher AOV

**Profitability Check:**
- At $${suggestedRetail.toFixed(2)}: ${((suggestedRetail - minimumPrice) / suggestedRetail * 100).toFixed(1)}% profit margin
- Monthly goal: Sell 20 units = $${(suggestedRetail * 20).toFixed(2)} revenue
- Profit: $${((suggestedRetail - minimumPrice) * 20).toFixed(2)}

Would you like me to analyze competitor pricing or explore different pricing strategies?`,
              },
            },
          ],
        };

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  // Resources functionality
  private getResources(): Resource[] {
    return [
      {
        name: 'etsy-api-docs',
        uri: 'etsy://docs/api',
        title: 'Etsy API Documentation',
        description: 'Comprehensive Etsy Open API v3 documentation and reference',
        mimeType: 'text/plain',
      },
      {
        name: 'etsy-seller-handbook',
        uri: 'etsy://docs/seller-handbook',
        title: 'Etsy Seller Handbook',
        description: 'Best practices and guides for Etsy sellers',
        mimeType: 'text/plain',
      },
      {
        name: 'etsy-seo-guide',
        uri: 'etsy://docs/seo-guide',
        title: 'Etsy SEO Guide',
        description: 'Complete guide to Etsy search engine optimization',
        mimeType: 'text/plain',
      },
      {
        name: 'etsy-shipping-guide',
        uri: 'etsy://docs/shipping',
        title: 'Etsy Shipping Guide',
        description: 'Shipping policies, strategies, and best practices',
        mimeType: 'text/plain',
      },
      {
        name: 'etsy-photography-tips',
        uri: 'etsy://docs/photography',
        title: 'Product Photography Tips',
        description: 'Professional product photography guide for Etsy',
        mimeType: 'text/plain',
      },
      {
        name: 'etsy-fees-calculator',
        uri: 'etsy://tools/fees-calculator',
        title: 'Etsy Fees Calculator',
        description: 'Calculate all Etsy fees and pricing recommendations',
        mimeType: 'application/json',
      },
    ];
  }

  private async readResource(uri: string): Promise<ReadResourceResult> {
    switch (uri) {
      case 'etsy://docs/api':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `# Etsy Open API v3 Documentation

**Base URL:** https://openapi.etsy.com/v3

## Authentication
- **API Key:** Required for all requests (x-api-key header)
- **OAuth 2.0:** Required for write operations and private data

## Rate Limits
- 10,000 requests per day per API key
- Burst limit: 10 requests per second

## Key Endpoints

### Listings
- GET /v3/application/listings/active - Search active listings
- GET /v3/application/listings/{listing_id} - Get listing details
- POST /v3/application/shops/{shop_id}/listings - Create listing (OAuth)
- PUT /v3/application/shops/{shop_id}/listings/{listing_id} - Update listing (OAuth)

### Shops
- GET /v3/application/shops/{shop_id} - Get shop details
- GET /v3/application/shops/{shop_id}/listings/active - Get shop listings
- PATCH /v3/application/shops/{shop_id} - Update shop (OAuth)

### Search
- GET /v3/application/listings/active - Search with filters
- GET /v3/application/shops - Search shops

## Common Parameters
- **limit:** Number of results (max 100)
- **offset:** Pagination offset
- **keywords:** Search terms
- **sort_on:** created, price, score
- **sort_order:** asc, desc

## Response Format
All responses return JSON with consistent structure:
{
  "count": 10,
  "results": [...],
  "next_page": "..."
}

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limit Exceeded
- 500: Internal Server Error

For complete documentation, visit: https://developers.etsy.com/documentation`,
            },
          ],
        };

      case 'etsy://docs/seller-handbook':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `# Etsy Seller Handbook

## Getting Started

### Shop Setup
1. Create your shop name (unique, memorable, brandable)
2. Set shop policies (returns, exchanges, privacy)
3. Configure payment methods
4. Set up shipping profiles
5. Add shop sections for organization

### Listing Optimization
- **Title:** 140 characters, front-load keywords
- **Tags:** 13 tags, mix broad and specific terms
- **Description:** Rich details, answer questions
- **Photos:** 10 images, high quality, multiple angles
- **Price:** Competitive but profitable

## Best Practices

### Product Photography
- Natural lighting or softbox setup
- White/neutral background for main image
- Lifestyle photos showing scale and use
- Detail shots of craftsmanship
- Consistent style across listings

### SEO Strategy
- Research keywords with Etsy search
- Use all 13 tag slots
- Update titles seasonally
- Monitor search analytics
- Optimize based on performance

### Customer Service
- Respond within 24 hours
- Be professional and friendly
- Address issues promptly
- Request reviews politely
- Build relationships

### Marketing
- Share listings on social media
- Use Etsy Ads strategically
- Offer promotions and sales
- Build email list
- Collaborate with other sellers

### Shop Management
- Update inventory regularly
- Process orders promptly
- Track metrics and analytics
- Adjust strategy based on data
- Stay current with Etsy policies

## Growth Strategies

### Scaling Your Business
1. Identify best-sellers
2. Create complementary products
3. Optimize production workflow
4. Consider help or automation
5. Expand product line strategically

### Seasonal Planning
- Plan inventory 3 months ahead
- Create seasonal listings early
- Adjust keywords for holidays
- Run strategic promotions
- Prepare for peak shipping times

## Resources
- Etsy Seller Handbook: https://www.etsy.com/seller-handbook
- Etsy Forums: Community support
- Etsy Teams: Local seller groups
- Etsy Success Newsletter: Tips and updates`,
            },
          ],
        };

      case 'etsy://docs/seo-guide':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `# Complete Etsy SEO Guide

## Understanding Etsy Search

Etsy search algorithm considers:
1. **Query Matching:** Titles, tags, categories, attributes
2. **Listing Quality Score:** Photos, description, shop policies
3. **Customer Experience:** Reviews, shipping, messages
4. **Shop History:** Sales, favorites, age

## Keyword Research

### Tools and Methods
- Etsy search bar autocomplete
- Competitor listing analysis
- Google Trends for seasonal terms
- Customer language from reviews
- Long-tail keyword variations

### Keyword Types
- **Broad terms:** "handmade jewelry"
- **Specific terms:** "sterling silver moon necklace"
- **Long-tail:** "personalized graduation gift for daughter"
- **Seasonal:** "Christmas stocking stuffer"

## Title Optimization

### Best Practices
- **Front-load keywords:** Most important words first
- **Be specific:** "Vintage 1960s Leather Crossbody Bag"
- **Include key attributes:** Size, color, material, use
- **Use natural language:** Readable, not keyword stuffed
- **Stay under 140 characters**

### Title Formula
[What It Is] | [Key Features] | [Use Case/Benefit]

Example: "Handmade Ceramic Mug | 16oz Large Coffee Cup | Perfect Gift for Coffee Lovers"

## Tag Strategy

### Maximizing 13 Tags
- 3-4 broad terms (handmade jewelry)
- 4-5 specific terms (moonstone pendant necklace)
- 3-4 long-tail keywords (boho wedding jewelry gift)
- 1-2 seasonal/trending terms

### Tag Tips
- Use all 13 tags
- Multi-word phrases (etsy treats as one tag)
- Consider misspellings for common terms
- Update seasonally
- Test and adjust based on analytics

## Description SEO

### Structure
1. **Opening paragraph:** Keyword-rich summary (first 160 characters show in search)
2. **Key features:** Bullet points with natural keywords
3. **Details:** Size, materials, care instructions
4. **Story/Use cases:** Emotional connection
5. **Policies:** Shipping, returns (reassurance)

### SEO Writing Tips
- Natural keyword integration
- Answer common questions
- Use headers/formatting
- Include relevant attributes
- Cross-link related listings

## Categories and Attributes

### Importance
- Required for category-specific searches
- Helps Etsy understand your product
- Affects search placement

### Best Practices
- Choose most specific category
- Fill all relevant attributes
- Be accurate (affects trust signals)
- Update when Etsy adds new options

## Shop-Wide SEO

### Shop Title
- Appears in external search (Google)
- Include main product category
- Keep under 55 characters

### Shop Sections
- Organize products logically
- Use keyword-rich section names
- Helps customers browse
- Improves internal linking

### About Section
- Tell your brand story
- Include relevant keywords naturally
- Build trust and connection

## Performance Tracking

### Key Metrics
- **Search views:** How often listings appear
- **Click-through rate:** Views vs. visits
- **Conversion rate:** Visits to sales
- **Search terms:** What brings traffic

### Tools
- Etsy Stats (Shop Manager)
- Google Analytics (external traffic)
- Search Analytics (keyword performance)

## Advanced Strategies

### A/B Testing
- Test title variations
- Try different primary photos
- Adjust pricing strategies
- Monitor conversion impact

### Seasonal Optimization
- Update keywords 6-8 weeks before holidays
- Create seasonal landing collections
- Adjust inventory for demand
- Plan content calendar

### External SEO
- Social media sharing
- Blog content
- Pinterest optimization
- Backlink building

## Common SEO Mistakes

### Avoid These
- ❌ Keyword stuffing (unreadable titles)
- ❌ Irrelevant tags (misleading)
- ❌ All caps titles (looks spammy)
- ❌ Trademark violations
- ❌ Duplicate listings (compete with yourself)
- ❌ Ignoring analytics (data-driven decisions)

## Quick Wins Checklist

1. ✅ Use all 13 tags on every listing
2. ✅ Front-load titles with keywords
3. ✅ Fill all category attributes
4. ✅ Add 10 high-quality photos
5. ✅ Write detailed descriptions
6. ✅ Update seasonal listings early
7. ✅ Monitor and adjust based on stats
8. ✅ Respond to messages quickly
9. ✅ Encourage reviews
10. ✅ Keep inventory active

Remember: SEO is ongoing. Review and optimize regularly based on performance data.`,
            },
          ],
        };

      case 'etsy://docs/shipping':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `# Etsy Shipping Guide

## Shipping Strategy

### Setting Up Profiles
- Create profiles for different product types
- Include domestic and international options
- Consider package dimensions and weight
- Build in handling time realistically

### Pricing Models
1. **Calculated shipping:** Real-time carrier rates
2. **Fixed shipping:** Set price per location
3. **Free shipping:** Built into product price
4. **Combined shipping:** Discounts for multiple items

## Domestic Shipping (US)

### Carrier Options
- **USPS:** Most cost-effective for small items
  - First Class: Under 16oz, 2-5 days
  - Priority Mail: 1-3 days, includes tracking
  - Priority Express: Overnight
- **UPS/FedEx:** Better for heavy items
- **Regional carriers:** For local deliveries

### Shipping Supplies
- Proper boxes/mailers for protection
- Bubble wrap or packing peanuts
- Thank you cards/branding materials
- Shipping labels (consider label printer)
- Tape gun for efficiency

## International Shipping

### Considerations
- Customs forms required
- Longer delivery times (7-21+ days)
- Higher costs
- Customs fees (buyer responsibility)
- Tracking may be limited

### International Best Practices
- Clearly state delivery times
- Mention customs fees in listing
- Use USPS International services
- Consider restricted countries
- Package securely for long transit

## Free Shipping

### Etsy Free Shipping Guarantee
- US orders $35+
- Boosts search placement
- Competitive advantage

### Implementation Strategies
1. **Built-in pricing:** Add shipping to product cost
2. **Threshold:** Free over $X
3. **Flat rate:** Same price all items
4. **Promotional:** Limited time offers

### Making It Work
- Calculate average shipping cost
- Adjust product pricing accordingly
- Monitor profit margins
- Test different thresholds

## Processing and Handling

### Handling Time
- Set realistic timeframes
- Account for production time
- Consider weekends/holidays
- Update for busy seasons
- Communicate delays promptly

### Best Practices
- Process orders within 24 hours
- Print labels via Etsy (discounts)
- Upload tracking immediately
- Send shipped notification
- Include tracking in message

## Packaging Tips

### Protection
- Double box fragile items
- Use adequate cushioning
- Seal securely with quality tape
- Waterproof if necessary
- Test drop to ensure safety

### Branding
- Thank you card with logo
- Branded tissue paper/tape
- Business cards for reorders
- Care instruction cards
- Surprise bonus (sticker, sample)

### Sustainability
- Eco-friendly materials
- Minimal packaging (reduce waste)
- Recyclable/biodegradable options
- Reuse shipping materials
- Communicate green practices

## Tracking and Insurance

### Tracking
- Always include for $20+ orders
- Protects buyer and seller
- Required for claims
- Builds customer confidence
- Enables delivery confirmation

### Insurance
- Recommend for $100+ items
- Protects against loss/damage
- Small additional cost
- Peace of mind for both parties
- Required for high-value claims

## Handling Shipping Issues

### Lost Packages
1. Check tracking for updates
2. Contact carrier after expected delivery
3. File claim if insured
4. Reship or refund customer
5. Document everything

### Damaged Items
1. Request photos from customer
2. File carrier claim if insured
3. Offer replacement or refund
4. Improve packaging for future
5. Learn from issues

### Delays
- Communicate proactively
- Provide tracking updates
- Apologize sincerely
- Offer solutions (expedited reship)
- Learn from experience

## International Customs

### Required Information
- Accurate item description
- Value for customs
- Country of origin
- HS tariff code (when applicable)
- Proper forms (CN22, CN23)

### Common Issues
- Held in customs (varies by country)
- Duties/taxes (buyer pays)
- Restricted items (varies by country)
- Lost customs forms

## Shipping Metrics to Track

### Key Performance Indicators
- Average shipping cost per order
- Delivery time vs. promised time
- Damage/loss rate
- Customer satisfaction with shipping
- Carrier performance

### Optimization
- Compare carrier rates regularly
- Negotiate volume discounts
- Optimize package sizes
- Reduce handling time
- Improve packaging efficiency

## Seasonal Shipping

### Holiday Preparation
- Post cutoff dates clearly
- Allow extra processing time
- Recommend shipping upgrades
- Communicate delays promptly
- Set shop vacation if overwhelmed

### Peak Season Tips
- Order supplies early
- Batch process orders
- Use shipping software
- Consider hired help
- Maintain quality standards

## Shipping Policies

### What to Include
- Processing/handling time
- Shipping methods available
- International shipping details
- Customs/duties information
- Lost package procedures
- Upgrade options

### Communication
- Clear in listing descriptions
- Shop policies page
- Order messages
- FAQ section
- Proactive updates

Remember: Excellent shipping experience leads to 5-star reviews and repeat customers!`,
            },
          ],
        };

      case 'etsy://docs/photography':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `# Professional Product Photography for Etsy

## Equipment Essentials

### Camera Options
- **DSLR/Mirrorless:** Best quality and control
- **High-end smartphone:** Adequate for many products
- **Point-and-shoot:** Budget-friendly option

### Lighting
- **Natural light:** Free, beautiful (near window)
- **Softbox kit:** $50-200, consistent results
- **Ring light:** Great for small items
- **Reflectors:** Bounce and fill light ($20-40)

### Support Equipment
- **Tripod:** Essential for consistency ($30-100)
- **Backdrop:** White seamless paper or sweep
- **Light tent:** For small items ($20-50)
- **Props:** Lifestyle and scale reference

## Photo Requirements

### Technical Specifications
- **Resolution:** Minimum 2000px longest side
- **Format:** JPG preferred
- **File size:** Under 1MB for fast loading
- **Aspect ratio:** Square (1:1) ideal
- **Number:** Use all 10 slots

### Etsy-Specific Considerations
- First photo is thumbnail (most important)
- Mobile optimization critical (70% traffic)
- Photos appear in search results
- Zoom feature requires high resolution

## The Essential Shot List

### 1. Hero Shot (Main Photo)
- Clean white/neutral background
- Product centered and well-lit
- Shows full item clearly
- No distractions
- **This determines clicks!**

### 2. Detail Shots (2-3 photos)
- Close-ups of craftsmanship
- Texture and materials
- Quality indicators
- Unique features
- Proof of handmade quality

### 3. Scale Reference (1-2 photos)
- Product in hand
- Next to common object (coin, ruler)
- Lifestyle shot showing size
- Multiple items together

### 4. Lifestyle Photos (2-3 photos)
- Product in use
- Styled in environment
- Emotional connection
- Shows practical application
- Aspirational yet relatable

### 5. Variations (if applicable)
- Color options
- Size options
- Customization examples
- Before/after (if relevant)

### 6. Packaging Shot (1 photo)
- How it arrives
- Gift-ready presentation
- Professional impression
- Sets expectations

## Lighting Techniques

### Natural Light Setup
1. **Location:** Near large window
2. **Time:** Overcast day or indirect sunlight
3. **Positioning:** Product 3-5 feet from window
4. **Fill light:** White reflector opposite window
5. **Background:** Window to side, not behind

### Artificial Light Setup
1. **Main light:** 45° angle, above product
2. **Fill light:** Opposite side, lower intensity
3. **Background light:** Optional, separates product
4. **Diffusion:** Soften with umbrella or softbox

### Common Lighting Mistakes
- ❌ Direct harsh sunlight (hard shadows)
- ❌ Yellow indoor bulbs (color cast)
- ❌ Mixed light sources (inconsistent color)
- ❌ Underexposure (dark, details lost)
- ❌ Overexposure (blown highlights)

## Styling and Composition

### Rule of Thirds
- Divide frame into 3x3 grid
- Place subject at intersections
- Creates visual interest
- More dynamic than centered

### Background Choices
- **White:** Clean, professional, versatile
- **Neutral (gray, beige):** Sophisticated
- **Wood/texture:** Warm, handmade feel
- **Lifestyle setting:** Context and story
- **Avoid:** Busy patterns, competing colors

### Props and Styling
- **Purpose:** Complement, not compete
- **Scale:** Show size and context
- **Color:** Harmonize with product
- **Relevance:** Support product story
- **Minimalism:** Less is often more

## Camera Settings

### Smartphone Photography
- **HDR Mode:** ON for balanced exposure
- **Grid:** Enable for composition
- **Focus:** Tap to focus on product
- **Exposure:** Adjust with slider
- **Portrait Mode:** Use for depth (carefully)

### DSLR/Mirrorless Settings
- **Aperture:** f/8-f/16 for sharpness
- **ISO:** 100-400 (minimize noise)
- **Shutter speed:** 1/125 or faster
- **White balance:** Match light source
- **Shooting mode:** Aperture priority or manual

## Post-Processing

### Essential Edits
1. **Crop:** Straighten and compose
2. **Exposure:** Brighten if needed
3. **White balance:** Correct color cast
4. **Contrast:** Add depth
5. **Sharpen:** Enhance details (subtle)

### Editing Software
- **Mobile:** Snapseed, VSCO, Lightroom Mobile
- **Desktop:** Adobe Lightroom, Photoshop
- **Free:** GIMP, Photopea
- **Etsy App:** Basic editing built-in

### Consistency is Key
- Create presets for brand look
- Edit entire shoot together
- Match lighting across images
- Maintain color accuracy
- Same background style

## Category-Specific Tips

### Jewelry
- Macro lens or smartphone macro mode
- Neutral background or lifestyle
- Show scale (worn on model)
- Capture sparkle and detail
- Multiple angles of stones

### Clothing
- On model or dress form
- Show fit and drape
- Detail shots of fabric/stitching
- Size chart reference
- Flat lay for patterns

### Home Decor
- Staged in room setting
- Show scale with furniture
- Multiple room applications
- Detail shots of materials
- Lighting effects if applicable

### Art/Prints
- Straight-on, no distortion
- Frame it to show presentation
- Include size reference
- Detail shot if textured
- Lifestyle shot on wall

## Mobile Photography Tips

### Smartphone Best Practices
- Clean lens before shooting
- Use built-in grid lines
- Tap to focus on product
- Shoot in natural light
- Use HDR mode
- Take multiple shots
- Edit consistently

### Mobile Limitations
- Lower resolution than DSLR
- Less control over depth of field
- Challenging in low light
- Limited zoom (use digital carefully)

## Video Content

### Why Add Video
- 360° product view
- Show size and scale
- Demonstrate use
- Increase engagement
- Boost conversions

### Video Tips
- 5-15 seconds ideal
- Stable (use tripod)
- Good lighting
- Slow smooth movements
- No sound needed
- Show key features

## Photo Mistakes to Avoid

### Common Errors
- ❌ Cluttered background
- ❌ Poor lighting (dark/yellow)
- ❌ Blurry images
- ❌ Incorrect colors
- ❌ Can't see details
- ❌ Inconsistent style
- ❌ Filter overuse
- ❌ Watermarks (reduces clicks)

## Workflow Efficiency

### Batch Photography
1. Set up once for multiple products
2. Same lighting for consistency
3. Shoot all variations
4. Edit together with presets
5. Upload in batch

### Time-Saving Tips
- Prepare all products beforehand
- Set up permanent photo station
- Use presets for editing
- Create shot list template
- Schedule regular photo days

## Testing and Optimization

### A/B Testing
- Try different main photos
- Test lifestyle vs. white background
- Monitor click-through rates
- Adjust based on performance

### Analytics
- Track which photos get clicked
- Monitor conversion rates
- Note customer questions about photos
- Update based on data

Remember: Photos are your most important listing element. Invest time in getting them right!`,
            },
          ],
        };

      case 'etsy://tools/fees-calculator':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                title: 'Etsy Fees Calculator',
                description: 'Calculate all Etsy fees and determine optimal pricing',
                fees: {
                  listing_fee: 0.20,
                  transaction_fee_percent: 6.5,
                  payment_processing_percent: 3.0,
                  payment_processing_fixed: 0.25,
                  offsite_ads_percent: 12.0, // for sales under $10k/year
                  currency_conversion_percent: 2.5,
                },
                calculator: {
                  example: {
                    product_price: 50.00,
                    calculation: {
                      listing_fee: 0.20,
                      transaction_fee: 3.25, // 6.5% of $50
                      payment_processing: 1.75, // 3% of $50 + $0.25
                      total_fees: 5.20,
                      seller_receives: 44.80,
                      fee_percentage: 10.4,
                    },
                  },
                },
                pricing_formula: {
                  minimum_price: '(Material_Cost + Labor_Cost + Overhead) / (1 - Fee_Percentage)',
                  suggested_retail: 'Minimum_Price * (1 + Desired_Profit_Margin)',
                  profit_margin: 'Recommended 30-50% for sustainable business',
                },
                tips: [
                  'Build fees into your pricing, don\'t absorb them',
                  'Account for 10-15% in fees for domestic sales',
                  'Add 15-20% for international sales (currency conversion)',
                  'Remember offsite ads are 12% (15% if over $10k annual)',
                  'Free shipping? Add average shipping cost to price',
                  'Consider payment processor fees vary by country',
                ],
              }, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown resource URI: ${uri}`);
    }
  }

  getServer(): Server {
    return this.server;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Etsy MCP Server running on stdio');
  }
}

// Smithery createServer export (required for Smithery deployment)
export default function createServer({ config }: { config?: z.infer<typeof configSchema> }) {
  const etsyConfig: EtsyConfig = {
    apiKey: config?.apiKey || process.env.ETSY_API_KEY || '',
    shopId: config?.shopId || process.env.ETSY_SHOP_ID,
    accessToken: config?.accessToken || process.env.ETSY_ACCESS_TOKEN,
  };

  if (!etsyConfig.apiKey) {
    throw new Error('ETSY_API_KEY is required. Provide it via config or environment variable.');
  }

  const mcpServer = new EtsyMCPServer(etsyConfig);
  return mcpServer.getServer();
}

// CLI entry point (for direct execution with stdio)
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: EtsyConfig = {
    apiKey: process.env.ETSY_API_KEY || '',
    shopId: process.env.ETSY_SHOP_ID,
    accessToken: process.env.ETSY_ACCESS_TOKEN,
  };

  if (!config.apiKey) {
    console.error('Error: ETSY_API_KEY environment variable is required');
    process.exit(1);
  }

  const server = new EtsyMCPServer(config);
  server.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
