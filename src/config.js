// Configuration for the Dogecoin Indexer API
export const config = {
  // Base URL for the indexer API
  // Using Vite proxy to avoid CORS issues during development
  INDEXER_API_URL: '/api',
  
  // Refresh interval for blocks data (in milliseconds)
  BLOCKS_REFRESH_INTERVAL: 10000, // 10 seconds
  
  // Maximum number of blocks to display
  MAX_BLOCKS_DISPLAY: 10,
  
  // Reconnection settings
  RECONNECTION: {
    INTERVAL: 10000,        // Reconnection attempt interval (10 seconds)
    MAX_ATTEMPTS: 100       // Maximum reconnection attempts (unlimited for monitoring)
  },
  
  // API retry configuration
  RETRY: {
    MAX_RETRIES: 3,           // Maximum number of retry attempts
    BASE_DELAY: 1000,         // Base delay in milliseconds (1 second)
    MAX_DELAY: 10000,         // Maximum delay in milliseconds (10 seconds)
    BACKOFF_MULTIPLIER: 2     // Exponential backoff multiplier
  },
  
  // API endpoints
  ENDPOINTS: {
    BLOCKS: '/blocks',
    HEIGHT: '/height',
    BALANCE: '/balance',
    UTXO: '/utxo',
    HEALTH: '/health'
  }
};
