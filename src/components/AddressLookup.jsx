import React, { useState } from 'react';
import { indexerApi } from '../services/indexerApi';
import './AddressLookup.css';

const AddressLookup = () => {
  const [addressInput, setAddressInput] = useState('');
  const [addressData, setAddressData] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);

  const fetchAddressData = async (address) => {
    if (!address.trim()) return;
    
    setAddressLoading(true);
    setAddressError(null);
    setAddressData(null);
    
    try {
      const [balanceData, utxoData] = await Promise.all([
        indexerApi.getBalance(address),
        indexerApi.getUtxo(address)
      ]);
      
      setAddressData({
        address,
        balance: balanceData,
        utxos: utxoData || []
      });
    } catch (error) {
      console.error('Failed to fetch address data:', error);
      setAddressError(error.message || 'Failed to fetch address data');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    fetchAddressData(addressInput);
  };

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return hash;
  };

  return (
    <div className="address-lookup-container">
      <div className="address-lookup-header">
        <h2>Address Lookup</h2>
        <p>Enter a Dogecoin address to view its balance and UTXOs</p>
      </div>

      <form onSubmit={handleAddressSubmit} className="address-form">
        <div className="address-input-group">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Enter Dogecoin address (e.g., D...)"
            className="address-input"
            disabled={addressLoading}
          />
          <button 
            type="submit" 
            className="lookup-btn"
            disabled={addressLoading || !addressInput.trim()}
          >
            {addressLoading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </form>

      {addressError && (
        <div className="address-error">
          <h3>Error</h3>
          <p>{addressError}</p>
        </div>
      )}

      {addressData && (
        <div className="address-results">
          <div className="address-info">
            <h3>Address: {addressData.address}</h3>
          </div>

          <div className="balance-section">
            <h4>Balance</h4>
            <div className="balance-details">
              <div className="balance-item">
                <span className="label">Available:</span>
                <span className="value">{addressData.balance.available}</span>
              </div>
              <div className="balance-item">
                <span className="label">Incoming:</span>
                <span className="value">{addressData.balance.incoming}</span>
              </div>
              <div className="balance-item">
                <span className="label">Current:</span>
                <span className="value">{addressData.balance.current}</span>
              </div>
            </div>
          </div>

          <div className="utxo-section">
            <h4>UTXOs ({addressData.utxos.length})</h4>
            {addressData.utxos.length > 0 ? (
              <div className="utxo-list">
                {addressData.utxos.map((utxo, index) => (
                  <div key={index} className="utxo-item">
                    <div className="utxo-header">
                      <span className="utxo-txid">tx: {formatHash(utxo.tx)}</span>
                      <span className="utxo-vout">vout: {utxo.vout}</span>
                    </div>
                    <div className="utxo-details">
                      <div className="utxo-detail-row">
                        <span className="label">Value:</span>
                        <span className="value">{utxo.value}</span>
                      </div>
                      <div className="utxo-detail-row">
                        <span className="label">Type:</span>
                        <span className="value">{utxo.type}</span>
                      </div>
                      <div className="utxo-detail-row">
                        <span className="label">Script:</span>
                        <span className="value script-hash">{formatHash(utxo.script)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-utxos">No UTXOs found for this address</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressLookup;
