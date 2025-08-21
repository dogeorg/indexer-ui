import './App.css'
import { useState, useEffect, useRef } from 'react'
import Blocks from './components/Blocks'
import AddressLookup from './components/AddressLookup'
import { indexerApi } from './services/indexerApi'
import { config } from './config'

function App() {
  const [activeTab, setActiveTab] = useState('blocks');
  
  // Block monitoring state (lifted up to persist across tabs)
  const [blocks, setBlocks] = useState([]);
  const [height, setHeight] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [reconnectCountdown, setReconnectCountdown] = useState(0);
  const [nextBlockCountdown, setNextBlockCountdown] = useState(0);
  const [newBlockIndexes, setNewBlockIndexes] = useState(new Set());
  
  // Refs for intervals
  const dataIntervalRef = useRef(null);
  const reconnectIntervalRef = useRef(null);
  const reconnectCountdownRef = useRef(null);
  const nextBlockCountdownRef = useRef(null);

  // Block monitoring functions
  const clearDataUpdates = () => {
    if (dataIntervalRef.current) {
      clearInterval(dataIntervalRef.current);
      dataIntervalRef.current = null;
    }
  };

  const clearReconnectionAttempts = () => {
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    setConnectionAttempts(0);
  };

  const clearReconnectCountdown = () => {
    if (reconnectCountdownRef.current) {
      clearInterval(reconnectCountdownRef.current);
      reconnectCountdownRef.current = null;
    }
    setReconnectCountdown(0);
  };

  const clearNextBlockCountdown = () => {
    if (nextBlockCountdownRef.current) {
      clearInterval(nextBlockCountdownRef.current);
      nextBlockCountdownRef.current = null;
    }
    setNextBlockCountdown(0);
  };

  const clearAllIntervals = () => {
    clearDataUpdates();
    clearReconnectionAttempts();
    clearReconnectCountdown();
    clearNextBlockCountdown();
  };

  const calculateNextBlockPrediction = (currentBlocks = blocks) => {
    // Calculate average time between blocks
    let totalTimeBetweenBlocks = 0;
    let validBlockPairs = 0;
    
    for (let i = 0; i < currentBlocks.length - 1; i++) {
      const currentBlockTime = new Date(currentBlocks[i].timestamp);
      const previousBlockTime = new Date(currentBlocks[i + 1].timestamp);
      
      if (!isNaN(currentBlockTime.getTime()) && !isNaN(previousBlockTime.getTime())) {
        const timeBetweenBlocks = currentBlockTime.getTime() - previousBlockTime.getTime();
        totalTimeBetweenBlocks += timeBetweenBlocks;
        validBlockPairs++;
        console.log('🕐 Valid block pair found, total time between blocks:', totalTimeBetweenBlocks);
      }
    }
    
    // If we have no valid block pairs, use 60 second fallback
    if (validBlockPairs === 0) {
      return new Date(Date.now() + 60000);
    }
    
    // Calculate average and predict next block
    const averageBlockTime = totalTimeBetweenBlocks / validBlockPairs;
    
    // Use last block time if available, otherwise current time
    const lastBlockTime = new Date(currentBlocks[0].timestamp);
    const baseTime = !isNaN(lastBlockTime.getTime()) ? lastBlockTime : new Date();
    
    return new Date(baseTime.getTime() + averageBlockTime);
  };

  const startNextBlockCountdown = (currentBlocks) => {
    // Clear any existing countdown
    clearNextBlockCountdown();
    
    const predictedTime = calculateNextBlockPrediction(currentBlocks);
    console.log('🕐 Starting new block countdown, predicted time:', predictedTime);
    
    const updateCountdown = () => {
      const now = new Date();
      const timeUntilNext = Math.floor((predictedTime.getTime() - now.getTime()) / 1000);
      
      if (timeUntilNext < -60) {
        // Block is very overdue, clear the countdown
        // The next data fetch will restart it automatically
        console.log('⏰ Block is very overdue, clearing countdown...');
        clearNextBlockCountdown();
        return;
      }
      
      setNextBlockCountdown(timeUntilNext);
    };
    
    // Update immediately
    updateCountdown();
    
    // Start countdown timer
    const interval = setInterval(updateCountdown, 1000);
    nextBlockCountdownRef.current = interval;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [blocksData, heightData] = await Promise.all([
        indexerApi.getBlocks(),
        indexerApi.getHeight()
      ]);
      
      // Track which blocks are new
      const newBlocks = new Set();
      if (blocks.length > 0 && blocksData.length > 0) {
        // Find new blocks by comparing heights
        const existingHeights = new Set(blocks.map(b => b.height));
        blocksData.forEach((block, index) => {
          if (!existingHeights.has(block.height)) {
            newBlocks.add(index);
          }
        });
      }
      
      setBlocks(blocksData);
      setHeight(heightData);
      setNewBlockIndexes(newBlocks);
      
      // Only restart countdown if we have new blocks
      if (newBlocks.size > 0) {
        startNextBlockCountdown(blocksData);
      }
      
      // Clear new block indicators after animation
      setTimeout(() => {
        setNewBlockIndexes(new Set());
      }, 4000);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startDataUpdates = () => {
    // Clear any existing data update interval
    clearDataUpdates();
    
    // Start periodic data updates
    dataIntervalRef.current = setInterval(async () => {
      try {
        await fetchData();
      } catch (error) {
        console.error('Periodic data update failed:', error);
        handleOfflineStatus();
      }
    }, config.BLOCKS_REFRESH_INTERVAL);
  };

  const handleOfflineStatus = () => {
    setIsOnline(false);
    setError('Backend connection lost. Attempting to reconnect...');
    setLoading(false);
    
    // Stop data updates
    clearDataUpdates();
    
    // Start periodic reconnection attempts
    startReconnectionAttempts();
  };

  const startReconnectionAttempts = () => {
    // Clear any existing intervals
    clearReconnectionAttempts();
    clearReconnectCountdown();
    
    // Start countdown timer
    startReconnectCountdown();
    
    // Attempt reconnection every 10 seconds
    reconnectIntervalRef.current = setInterval(async () => {
      setConnectionAttempts(prev => prev + 1);
      console.log(`Reconnection attempt ${connectionAttempts + 1}`);
      
      try {
        const connectionResult = await indexerApi.testConnection();
        if (connectionResult.success) {
          console.log('Reconnection successful, resuming data updates');
          setIsOnline(true);
          setError(null);
          setConnectionAttempts(0);
          setReconnectCountdown(0);
          
          // Fetch data and resume updates
          await startDataUpdatesWithCountdown();
          
          // Clear reconnect interval
          clearReconnectionAttempts();
          
          // Clear countdown
          clearReconnectCountdown();
        } else {
          // Restart countdown for next attempt
          startReconnectCountdown();
        }
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        // Restart countdown for next attempt
        startReconnectCountdown();
      }
    }, config.RECONNECTION.INTERVAL);
  };

  const startReconnectCountdown = () => {
    // Clear any existing countdown
    clearReconnectCountdown();
    
    // Set initial countdown value
    setReconnectCountdown(Math.ceil(config.RECONNECTION.INTERVAL / 1000));
    
    // Start countdown timer
    reconnectCountdownRef.current = setInterval(() => {
      setReconnectCountdown(prev => {
        if (prev <= 1) {
          return Math.ceil(config.RECONNECTION.INTERVAL / 1000);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startDataUpdatesWithCountdown = async () => {
    // Fetch data immediately
    await fetchData();
    
    // Start continuous data updates
    startDataUpdates();
  };

  const testConnectionAndFetch = async () => {
    try {
      const connectionResult = await indexerApi.testConnection();
      
      if (connectionResult.success) {
        setIsOnline(true);
        setError(null);
        setConnectionAttempts(0);
        setReconnectCountdown(0);
        
        // Fetch data immediately
        await startDataUpdatesWithCountdown();
        
        // Start next block prediction countdown
        startNextBlockCountdown(blocks);
        
        // Clear any reconnect interval
        clearReconnectionAttempts();
        
        // Clear countdown
        clearReconnectCountdown();
      } else {
        handleOfflineStatus();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      handleOfflineStatus();
    }
  };

  // Initial connection test
  useEffect(() => {
    testConnectionAndFetch();
    
    // Cleanup on unmount
    return () => {
      clearAllIntervals();
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dogecoin Indexer UI</h1>
        <p>Real-time blockchain data from the Dogecoin indexer</p>
      </header>
      
      <nav className="app-nav">
        <button 
          className={`nav-tab ${activeTab === 'blocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocks')}
        >
          📊 Block Monitor
        </button>
        <button 
          className={`nav-tab ${activeTab === 'address' ? 'active' : ''}`}
          onClick={() => setActiveTab('address')}
        >
          🔍 Address Lookup
        </button>
      </nav>
      
      <main className="app-main">
        {activeTab === 'blocks' ? (
          <Blocks 
            isActive={activeTab === 'blocks'} 
            blocks={blocks}
            height={height}
            isOnline={isOnline}
            loading={loading}
            error={error}
            connectionAttempts={connectionAttempts}
            reconnectCountdown={reconnectCountdown}
            nextBlockCountdown={nextBlockCountdown}
            newBlockIndexes={newBlockIndexes}
            onManualRetry={testConnectionAndFetch}
          />
        ) : (
          <AddressLookup />
        )}
      </main>
    </div>
  )
}

export default App
