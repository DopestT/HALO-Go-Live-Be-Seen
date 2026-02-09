# Crypto Terminal Dashboard

A **standalone Python terminal dashboard** for simulated crypto trading.  
It shows live prices, trading signals, mini ASCII charts, portfolio summary, and logs trades to a CSV file.

---

## Features

- Multi-coin simulated dashboard: BTC, ETH, SOL, DOGE  
- Color-coded signals: **BUY** (green), **SELL** (red), **HOLD** (yellow)  
- Trend arrows: 📈 up, 📉 down, ➡ stable  
- Mini ASCII sparkline charts for recent price history  
- Portfolio summary with total value and profit percentages  
- Rolling alerts for stop-loss / circuit breaker events  
- CSV logging of every simulated trade (`simulated_trades_log.csv`)  

---

## Requirements

- Python 3.10+  
- `rich` library

Install dependencies with:

```bash
pip install -r requirements.txt
