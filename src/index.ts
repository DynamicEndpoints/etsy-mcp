#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
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
