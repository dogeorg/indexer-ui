import { config } from '../config';

// Retry configuration from config
const RETRY_CONFIG = {
  maxRetries: config.RETRY.MAX_RETRIES,
  baseDelay: config.RETRY.BASE_DELAY,
  maxDelay: config.RETRY.MAX_DELAY,
  backoffMultiplier: config.RETRY.BACKOFF_MULTIPLIER
};

// Exponential backoff retry function
async function retryWithBackoff(fn, retryCount = 0) {
  try {
    return await fn();
  } catch (error) {
    if (retryCount >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
      RETRY_CONFIG.maxDelay
    );

    console.warn(`API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}):`, error.message);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retryCount + 1);
  }
}

// Generic API call wrapper with retry logic
async function apiCall(endpoint, options = {}) {
  const url = `${config.INDEXER_API_URL}${endpoint}`;
  
  console.log(`🌐 Making API call to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API call successful:`, data);
    return data;
  } catch (error) {
    console.error(`💥 API call failed for ${endpoint}:`, error);
    
    // Log additional details for debugging
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('🔒 This looks like a CORS or network issue. Check:');
      console.error('   - Backend CORS configuration');
      console.error('   - Network connectivity');
      console.error('   - Backend is running and accessible');
    }
    
    throw error;
  }
}

export const indexerApi = {
  async getBlocks() {
    return retryWithBackoff(async () => {
      const data = await apiCall(config.ENDPOINTS.BLOCKS);
      return data.blocks || [];
    });
  },

  async getHeight() {
    return retryWithBackoff(async () => {
      const data = await apiCall(config.ENDPOINTS.HEIGHT);
      return data.height;
    });
  },

  async getBalance(address) {
    return retryWithBackoff(async () => {
      const data = await apiCall(`${config.ENDPOINTS.BALANCE}?address=${encodeURIComponent(address)}`);
      return data;
    });
  },

  async getUtxo(address) {
    return retryWithBackoff(async () => {
      const data = await apiCall(`${config.ENDPOINTS.UTXO}?address=${encodeURIComponent(address)}`);
      return data.utxo || [];
    });
  },

  async getHealth() {
    return retryWithBackoff(async () => {
      const data = await apiCall(config.ENDPOINTS.HEALTH);
      return data;
    });
  },

  // Test connection to the indexer API
  async testConnection() {
    try {
      console.log('🔍 Testing connection to Indexer API...');
      const startTime = Date.now();
      await this.getHealth();
      const responseTime = Date.now() - startTime;
      console.log(`✅ Indexer API connection successful (${responseTime}ms)`);
      return { success: true, responseTime };
    } catch (error) {
      console.error('❌ Indexer API connection failed:', error.message);
      console.error('🔍 Error details:', error);
      return { success: false, error: error.message };
    }
  },

  // Simple CORS test - just try to fetch the health endpoint
  async testCORS() {
    const url = `${config.INDEXER_API_URL}${config.ENDPOINTS.HEALTH}`;
    console.log(`🧪 Testing CORS for: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ CORS test successful: ${response.status}`);
      return { success: true, status: response.status };
    } catch (error) {
      console.error(`❌ CORS test failed:`, error);
      return { success: false, error: error.message };
    }
  }
};
