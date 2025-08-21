# Dogecoin Indexer UI

A modern React-based web interface for the Dogecoin Indexer project, built with Vite.

## Features

- **Real-time Block Display**: Shows recent blocks from the Dogecoin blockchain
- **Current Height**: Displays the current blockchain height
- **Auto-refresh**: Automatically updates data every 30 seconds
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling with retry functionality

## Prerequisites

- Node.js (v22.18.0 or higher recommended)
- The Dogecoin Indexer backend running (see [../indexer](../indexer))

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the Indexer API URL:**
   Edit `src/config.js` and update the `INDEXER_API_URL` if your indexer runs on a different host/port.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in the terminal)

## Configuration

The main configuration file is located at `src/config.js`:

```javascript
export const config = {
  INDEXER_API_URL: 'http://localhost:8888',        // Indexer API base URL
  BLOCKS_REFRESH_INTERVAL: 30000,                 // Refresh interval (30s)
  MAX_BLOCKS_DISPLAY: 50,                         // Max blocks to show
  // ... more options
};
```

## API Endpoints

The UI integrates with the following Indexer API endpoints:

- `GET /blocks` - Recent blocks data
- `GET /height` - Current blockchain height
- `GET /balance?address=<addr>` - Address balance
- `GET /utxo?address=<addr>` - Address UTXOs
- `GET /health` - API health status

## Project Structure

```
src/
├── components/
│   ├── Blocks.jsx          # Main blocks display component
│   └── Blocks.css          # Component styles
├── services/
│   └── indexerApi.js       # API service layer
├── config.js               # Configuration file
├── App.jsx                 # Main app component
├── App.css                 # App styles
├── main.jsx                # Entry point
└── index.css               # Global styles
```

## Development

- **Build for production:**
  ```bash
  npm run build
  ```

- **Preview production build:**
  ```bash
  npm run preview
  ```

- **Lint code:**
  ```bash
  npm run lint
  ```

## Troubleshooting

### "Unsupported Engine" Warnings
These warnings appear because your Node.js version is older than what Vite 7.x requires. Solutions:
- Update Node.js to v20.18.0+

### API Connection Issues
- Ensure the Indexer backend is running
- Check the API URL in `src/config.js`
- Verify the Indexer is accessible at the configured URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Dogeorg ecosystem.
# indexer-ui
