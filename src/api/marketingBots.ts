import apiClient from './client';

// ============ Types ============

export interface MarketingBot {
  id: number;
  name: string;
  bot_token: string;
  welcome_message: string;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingBotCreate {
  name: string;
  bot_token: string;
  welcome_message: string;
  image_url?: string | null;
  button_text?: string | null;
  button_url?: string | null;
}

export interface MarketingBotUpdate {
  name?: string;
  bot_token?: string;
  welcome_message?: string;
  image_url?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  is_active?: boolean;
}

// ============ API ============

const BASE = '/cabinet/admin/marketing-bots';

export const marketingBotsApi = {
  /** List all marketing bots. */
  getBots: async (): Promise<MarketingBot[]> => {
    const response = await apiClient.get<MarketingBot[]>(BASE);
    return response.data;
  },

  /** Get a single bot by id. */
  getBot: async (id: number): Promise<MarketingBot> => {
    const response = await apiClient.get<MarketingBot>(`${BASE}/${id}`);
    return response.data;
  },

  /** Create a new bot. */
  createBot: async (data: MarketingBotCreate): Promise<MarketingBot> => {
    const response = await apiClient.post<MarketingBot>(BASE, data);
    return response.data;
  },

  /** Update an existing bot (partial). */
  updateBot: async (id: number, data: MarketingBotUpdate): Promise<MarketingBot> => {
    const response = await apiClient.patch<MarketingBot>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** Delete a bot. */
  deleteBot: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
