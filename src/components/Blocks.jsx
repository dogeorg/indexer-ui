import React, { useEffect } from 'react';
import './Blocks.css';

const Blocks = ({ 
  onBlocksUpdate, 
  blocks, 
  height, 
  isOnline, 
  loading, 
  error, 
  connectionAttempts, 
  reconnectCountdown, 
  nextBlockCountdown, 
  newBlockIndexes,
  onManualRetry 
}) => {
  useEffect(() => {
    // Notify parent component when blocks change
    if (onBlocksUpdate) {
      onBlocksUpdate(blocks);
    }
  }, [blocks, onBlocksUpdate]);

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return hash;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Handle both string timestamps and Date objects
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return 'N/A';
    // Format as HH:MM:SS
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Show offline status
  if (!isOnline) {
    return (
      <div className="blocks-container">
        <div className="offline-status">
          <div className="offline-icon">📡</div>
          <h3>Backend Offline</h3>
          <p className="offline-message">
            Cannot connect to the Dogecoin Indexer backend.
          </p>
          <div className="reconnection-info">
            <div className="reconnection-attempts">
              Reconnection attempts: {connectionAttempts}
            </div>
            <div className="reconnection-schedule">
              Next attempt in: {reconnectCountdown}s
            </div>
          </div>
          <div className="offline-actions">
            <button onClick={onManualRetry} className="retry-btn">
              Retry Now
            </button>
            <button onClick={() => window.location.reload()} className="reload-btn">
              Reload Page
            </button>
            <button 
              onClick={async () => {
                console.log('🧪 Running CORS test...');
                const result = await indexerApi.testCORS();
                console.log('CORS test result:', result);
                alert(`CORS test: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.error || 'No error'}`);
              }} 
              className="debug-btn"
            >
              Test CORS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && blocks.length === 0) {
    return (
      <div className="blocks-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <div>Connecting to backend...</div>
        </div>
      </div>
    );
  }

  // Show error state (only when online but data fetch fails)
  if (error && isOnline) {
    return (
      <div className="blocks-container">
        <div className="error">
          <h3>Data Fetch Error</h3>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={onManualRetry} className="retry-btn">
              Retry Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show blocks data
  return (
    <div className="blocks-container">
      <div className="blocks-header">
        <h2>Recent Blocks</h2>
        <div className="status-info">
          {height && (
            <div className="current-height">
              Current Height: <span className="height-value">{height.toLocaleString()}</span>
            </div>
          )}
          <div className="next-update">
            Next block predicted in: {nextBlockCountdown > -60 ? `${nextBlockCountdown}s` : 'Overdue'}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={onManualRetry} className="refresh-btn" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <div className="explorer-note">
            🔍 Click magnifying glass to view block details
          </div>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="no-blocks">No blocks available</div>
      ) : (
        <>
          <div className="blocks-grid">
            <div className="blocks-scroll-wrapper">
              {blocks.map((block, index) => (
                <div 
                  key={index} 
                  className={`block-card ${newBlockIndexes.has(index) ? 'new-block' : ''}`}
                >
                  <div className="block-header">
                    <span className="block-height">#{block.height}</span>
                    <span className="block-hash">{formatHash(block.hash)}</span>
                    <a 
                      href={`https://dogechain.info/block/${block.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block-explorer-link"
                      title="View block details in DogeChain explorer"
                    >
                      🔍
                    </a>
                  </div>
                  <div className="block-details">
                    <div className="detail-row">
                      <span className="label">Hash:</span>
                      <span className="value">{formatHash(block.hash)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Height:</span>
                      <span className="value">#{block.height}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Timestamp:</span>
                      <span className="value">{formatTimestamp(block.timestamp)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Transactions:</span>
                      <span className="value">{block.tx_count || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">UTXOs Created:</span>
                      <span className="value">{block.utxo_created || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">UTXOs Spent:</span>
                      <span className="value">{block.utxo_spent || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Processing Time:</span>
                      <span className="value">{block.processing_time_ms || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="blocks-footer">
            <div className="blocks-direction-labels">
              <div className="direction-label newer">← Newer</div>
              <div className="direction-label older">Older →</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Blocks;
