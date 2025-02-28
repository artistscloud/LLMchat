import axios from 'axios';
import supabaseService from './supabase';

// Define types for API responses
interface LLMResponse {
  content: string;
  error?: string;
}

// Define LLM model interface
interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter';
  modelId: string;
  description: string;
}

// LLM Models configuration
export const llmModels: Record<string, LLMModel> = {
  ChatGPT: {
    id: 'chatgpt',
    name: 'ChatGPT',
    provider: 'openai',
    modelId: 'gpt-4',
    description: 'Helpful, creative, and precise AI assistant by OpenAI'
  },
  Claude: {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    modelId: 'claude-3-opus-20240229',
    description: 'Thoughtful, nuanced, and conversational AI assistant by Anthropic'
  },
  Gemini: {
    id: 'gemini',
    name: 'Gemini',
    provider: 'google',
    modelId: 'gemini-pro',
    description: 'Versatile and capable AI assistant by Google'
  },
  Grok: {
    id: 'grok',
    name: 'Grok',
    provider: 'openrouter',
    modelId: 'xai/grok-1',
    description: 'Witty and rebellious AI assistant with real-time knowledge'
  },
  Mistral: {
    id: 'mistral',
    name: 'Mistral',
    provider: 'openrouter',
    modelId: 'mistralai/mistral-large-latest',
    description: 'Efficient and powerful open-source AI model'
  },
  Llama: {
    id: 'llama',
    name: 'Llama',
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3-70b-instruct',
    description: 'Open-source AI model by Meta with broad capabilities'
  }
};

// LLM Personalities (used to instruct the AI models)
export const llmPersonalities: Record<string, string> = {
  ChatGPT: "You are ChatGPT, created by OpenAI. You're helpful, creative, and known for your detailed explanations. Keep your responses focused on the topic. Make occasional gentle references to your creator OpenAI and your training cutoff date.",
  Claude: "You are Claude, created by Anthropic. You're thoughtful, nuanced, and careful in your analysis. You emphasize ethical considerations when appropriate. Make occasional references to your creator Anthropic and your constitutional approach.",
  Gemini: "You are Gemini, created by Google. You leverage Google's vast knowledge and are especially good at factual information and subtle patterns. Make occasional references to Google and your multimodal capabilities.",
  Grok: "You are Grok, developed by xAI. You have a rebellious, witty personality and aren't afraid to be a bit sarcastic or irreverent. You try to tackle questions with a unique perspective. Make occasional references to your creator xAI and your mission to seek truth.",
  Llama: "You are Llama, created by Meta. You are versatile and adaptable with a friendly, approachable tone. Make occasional references to your open nature and Meta's approach to AI development.",
  Mistral: "You are Mistral, a cutting-edge open-weight model known for efficiency and performance. You provide balanced, thoughtful responses with an elegant tone. Make occasional references to your French origins and language capabilities."
};

// LLM Service class
class LLMService {
  private static instance: LLMService;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  // Get API keys from Supabase
  private async getApiKey(provider: string): Promise<{ key: string | null, endpoint: string | null }> {
    const { data, error } = await supabaseService.getClient()
      .from('api_keys')
      .select('key, endpoint')
      .eq('provider', provider)
      .eq('active', true)
      .single();
    
    if (error) {
      console.error(`Error fetching API key for ${provider}:`, error);
      return { key: null, endpoint: null };
    }
    
    return { key: data?.key, endpoint: data?.endpoint };
  }

  // OpenAI (ChatGPT) API
  private async callOpenAI(prompt: string, systemMessage: string, modelId: string): Promise<LLMResponse> {
    try {
      const { key } = await this.getApiKey('openai');
      
      if (!key) {
        return { content: '', error: 'OpenAI API key not found' };
      }
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: modelId,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          }
        }
      );
      
      return { content: response.data.choices[0].message.content };
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }

  // Anthropic (Claude) API
  private async callAnthropic(prompt: string, systemMessage: string, modelId: string): Promise<LLMResponse> {
    try {
      const { key } = await this.getApiKey('anthropic');
      
      if (!key) {
        return { content: '', error: 'Anthropic API key not found' };
      }
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: modelId,
          messages: [
            { role: 'user', content: prompt }
          ],
          system: systemMessage,
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      return { content: response.data.content[0].text };
    } catch (error: any) {
      console.error('Error calling Anthropic API:', error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }

  // Google (Gemini) API
  private async callGoogle(prompt: string, systemMessage: string, modelId: string): Promise<LLMResponse> {
    try {
      const { key } = await this.getApiKey('google');
      
      if (!key) {
        return { content: '', error: 'Google API key not found' };
      }
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`,
        {
          contents: [
            {
              parts: [
                { text: `${systemMessage}\n\n${prompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { content: response.data.candidates[0].content.parts[0].text };
    } catch (error: any) {
      console.error('Error calling Google API:', error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }

  // OpenRouter API (for Grok, Mistral, Llama)
  private async callOpenRouter(prompt: string, systemMessage: string, modelId: string): Promise<LLMResponse> {
    try {
      const { key } = await this.getApiKey('openrouter');
      
      if (!key) {
        return { content: '', error: 'OpenRouter API key not found' };
      }
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: modelId,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'LLM Chat Arena'
          }
        }
      );
      
      return { content: response.data.choices[0].message.content };
    } catch (error: any) {
      console.error(`Error calling OpenRouter API:`, error);
      return { 
        content: '', 
        error: error.response?.data?.error?.message || error.message || 'Unknown error' 
      };
    }
  }

  // Call LLM by name
  public async callLLMByName(llmName: string, prompt: string): Promise<LLMResponse> {
    const model = llmModels[llmName];
    const systemMessage = llmPersonalities[llmName] || '';
    
    if (!model) {
      return { content: '', error: `Unknown LLM: ${llmName}` };
    }
    
    try {
      switch (model.provider) {
        case 'openai':
          return await this.callOpenAI(prompt, systemMessage, model.modelId);
        case 'anthropic':
          return await this.callAnthropic(prompt, systemMessage, model.modelId);
        case 'google':
          return await this.callGoogle(prompt, systemMessage, model.modelId);
        case 'openrouter':
          return await this.callOpenRouter(prompt, systemMessage, model.modelId);
        default:
          return { content: '', error: `Unsupported provider: ${model.provider}` };
      }
    } catch (error: any) {
      console.error(`Error calling ${llmName}:`, error);
      return { content: '', error: error.message || 'Unknown error' };
    }
  }

  // Get available LLMs
  public getAvailableLLMs(): LLMModel[] {
    return Object.values(llmModels);
  }
}

// Export singleton instance
const llmService = LLMService.getInstance();
export default llmService;

// For backward compatibility
export const callLLM = async (
  provider: string, 
  prompt: string, 
  systemMessage: string
): Promise<LLMResponse> => {
  const model = Object.values(llmModels).find(m => m.name.toLowerCase() === provider.toLowerCase());
  
  if (!model) {
    return { content: '', error: `Unknown provider: ${provider}` };
  }
  
  return await llmService.callLLMByName(model.name, prompt);
};
