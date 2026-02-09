# Crypto Terminal Dashboard

A **standalone Python terminal dashboard** for simulated crypto trading.  
It shows live prices, trading signals, mini ASCII charts, portfolio summary, and logs trades to a CSV file.

---

## Features

- 🪙 Multi-coin simulated dashboard: BTC, ETH, SOL, DOGE  
- 🎨 Color-coded signals: **BUY** (green), **SELL** (red), **HOLD** (yellow)  
- 📊 Trend arrows: 📈 up, 📉 down, ➡ stable  
- 📉 Mini ASCII sparkline charts for recent price history  
- 💼 Portfolio summary with total value and profit percentages  
- ⚠️  Rolling alerts for stop-loss / circuit breaker events  
- 📝 CSV logging of every simulated trade (`simulated_trades_log.csv`)  

---

## Requirements

- Python 3.10+  
- `rich` library for beautiful terminal UI

Install dependencies with:

```bash
pip install -r requirements.txt
```

---

## Usage

### Run the Dashboard

```bash
python dashboard_terminal.py
```

Or make it executable and run directly:

```bash
chmod +x dashboard_terminal.py
./dashboard_terminal.py
```

### Stop the Dashboard

Press `Ctrl+C` to gracefully stop the dashboard. It will display your final portfolio value and confirm that trades have been logged.

---

## How It Works

### Price Simulation
- Prices fluctuate randomly between -5% and +5% every 2 seconds
- Price history is maintained for the last 20 ticks
- Trends are calculated using moving averages

### Trading Signals
- **BUY**: Recent price trend is upward (>2% increase)
- **SELL**: Recent price trend is downward (>2% decrease)  
- **HOLD**: Price is relatively stable

### Portfolio Management
- Initial holdings are pre-configured (0.5 BTC, 2.0 ETH)
- Random trades are simulated (5% chance per update)
- Profit/Loss is calculated based on average purchase price
- All trades are logged to `simulated_trades_log.csv`

### Alerts
- Warnings appear when you hold coins that are trending down
- Suggests considering stop-loss strategies

---

## File Structure

```
crypto_terminal/
├── dashboard_terminal.py  # Main dashboard application
├── requirements.txt       # Python dependencies
├── .gitignore            # Ignore Python artifacts and logs
├── README.md             # This file
├── Dockerfile            # Docker container configuration
└── docker-compose.yml    # Docker compose setup
```

---

## Docker Support (Optional)

You can run the dashboard in a Docker container for isolation and portability.

### Build and Run with Docker

```bash
docker build -t crypto-terminal .
docker run -it crypto-terminal
```

### Or use Docker Compose

```bash
docker-compose up
```

---

## Output

The dashboard displays:
1. **Main Table**: Current prices, trends, signals, charts, holdings, and P&L for each coin
2. **Portfolio Summary**: Total value, cost basis, and overall profit/loss percentage
3. **Alerts Panel**: Warnings for coins trending down while you hold them

### Sample Output

```
🚀 Crypto Terminal Dashboard
┌──────┬───────────┬────────┬────────┬─────────────────┬──────────┬──────────┐
│ Coin │   Price   │ Trend  │ Signal │ Chart (20 ticks)│ Holdings │   P&L    │
├──────┼───────────┼────────┼────────┼─────────────────┼──────────┼──────────┤
│ BTC  │ $51,234   │ 📈 up  │  BUY   │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁ │  0.5000  │  +6.75%  │
│ ETH  │  $3,102   │ ➡ stable│  HOLD  │ ▄▄▅▅▄▄▄▅▅▄▄▄▃▃▄ │  2.0000  │  +6.97%  │
│ SOL  │   $98     │ 📉 down│  SELL  │ █▇▆▅▄▃▂▁▂▃▂▁▁▁▂ │  0.0000  │    -     │
│ DOGE │  $0.0987  │ ➡ stable│  HOLD  │ ▃▄▄▄▃▃▄▄▄▃▃▃▄▄▃ │  0.0000  │    -     │
└──────┴───────────┴────────┴────────┴─────────────────┴──────────┴──────────┘

💼 Portfolio Value: $28,789.12 | Cost Basis: $27,800.00 | Total P&L: +3.56%

⚠️  Alerts
⚠️  SOL trending down - consider stop-loss
```

---

## Trade Log

All simulated trades are logged to `simulated_trades_log.csv` with the following format:

```csv
Timestamp,Coin,Action,Price,Amount,Total
2024-02-09 15:30:45,BTC,BUY,50123.45,0.0234,1172.89
2024-02-09 15:31:12,ETH,SELL,3045.67,0.5000,1522.84
```

---

## Customization

You can customize the dashboard by editing `dashboard_terminal.py`:

- **COINS**: Add or remove cryptocurrencies
- **INITIAL_PRICES**: Set starting prices for each coin
- **UPDATE_INTERVAL**: Change refresh rate (in seconds)
- **PRICE_HISTORY_LENGTH**: Adjust chart length
- **portfolio**: Modify initial holdings and average prices

---

## License

This is a demonstration/educational tool. Not for actual trading.

---

## Contributing

Feel free to enhance this dashboard with:
- Real API integration (e.g., CoinGecko, Binance)
- More sophisticated trading signals
- Additional technical indicators
- User input for manual trades
- Historical data persistence

---

**Enjoy your crypto terminal! 🚀**
