#!/usr/bin/env python3
"""
Crypto Terminal Dashboard
A standalone Python terminal dashboard for simulated crypto trading.
"""

import random
import time
import csv
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich.text import Text

console = Console()

# Configuration
COINS = ["BTC", "ETH", "SOL", "DOGE"]
INITIAL_PRICES = {"BTC": 50000, "ETH": 3000, "SOL": 100, "DOGE": 0.10}
PRICE_HISTORY_LENGTH = 20
UPDATE_INTERVAL = 2  # seconds
CSV_LOG_FILE = "simulated_trades_log.csv"

# Portfolio state
portfolio = {coin: {"holdings": 0, "avg_price": 0} for coin in COINS}
portfolio["BTC"]["holdings"] = 0.5
portfolio["BTC"]["avg_price"] = 48000
portfolio["ETH"]["holdings"] = 2.0
portfolio["ETH"]["avg_price"] = 2900

# Price history for charts
price_history = {coin: [INITIAL_PRICES[coin]] * PRICE_HISTORY_LENGTH for coin in COINS}

# Current prices
current_prices = INITIAL_PRICES.copy()


def initialize_csv_log():
    """Initialize CSV log file if it doesn't exist."""
    if not Path(CSV_LOG_FILE).exists():
        with open(CSV_LOG_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Timestamp", "Coin", "Action", "Price", "Amount", "Total"])


def log_trade(coin: str, action: str, price: float, amount: float):
    """Log a simulated trade to CSV."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total = price * amount
    with open(CSV_LOG_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([timestamp, coin, action, f"{price:.2f}", f"{amount:.4f}", f"{total:.2f}"])


def update_prices():
    """Simulate price changes."""
    for coin in COINS:
        change_percent = random.uniform(-0.05, 0.05)  # -5% to +5%
        new_price = current_prices[coin] * (1 + change_percent)
        current_prices[coin] = new_price
        
        # Update history
        price_history[coin].pop(0)
        price_history[coin].append(new_price)


def get_trend(coin: str) -> Tuple[str, str]:
    """Get trend direction and arrow."""
    history = price_history[coin]
    if len(history) < 2:
        return "stable", "➡"
    
    recent_avg = sum(history[-5:]) / 5
    older_avg = sum(history[-10:-5]) / 5
    
    if recent_avg > older_avg * 1.02:
        return "up", "📈"
    elif recent_avg < older_avg * 0.98:
        return "down", "📉"
    else:
        return "stable", "➡"


def get_signal(coin: str) -> Tuple[str, str]:
    """Generate trading signal based on simple momentum."""
    trend, _ = get_trend(coin)
    
    if trend == "up":
        return "BUY", "green"
    elif trend == "down":
        return "SELL", "red"
    else:
        return "HOLD", "yellow"


def create_sparkline(values: List[float]) -> str:
    """Create ASCII sparkline chart."""
    if not values:
        return ""
    
    min_val = min(values)
    max_val = max(values)
    range_val = max_val - min_val if max_val != min_val else 1
    
    chars = "▁▂▃▄▅▆▇█"
    sparkline = ""
    for val in values:
        index = int((val - min_val) / range_val * (len(chars) - 1))
        sparkline += chars[index]
    
    return sparkline


def calculate_portfolio_value() -> Dict[str, float]:
    """Calculate total portfolio value and profit."""
    total_value = 0
    total_cost = 0
    
    for coin in COINS:
        holdings = portfolio[coin]["holdings"]
        avg_price = portfolio[coin]["avg_price"]
        current_price = current_prices[coin]
        
        position_value = holdings * current_price
        position_cost = holdings * avg_price
        
        total_value += position_value
        total_cost += position_cost
    
    profit_pct = ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "profit_pct": profit_pct
    }


def create_dashboard() -> Layout:
    """Create the main dashboard layout."""
    layout = Layout()
    
    # Create main table
    table = Table(title="🚀 Crypto Terminal Dashboard", style="bold cyan")
    table.add_column("Coin", style="bold white", justify="center")
    table.add_column("Price", justify="right")
    table.add_column("Trend", justify="center")
    table.add_column("Signal", justify="center")
    table.add_column("Chart (20 ticks)", justify="left")
    table.add_column("Holdings", justify="right")
    table.add_column("P&L", justify="right")
    
    for coin in COINS:
        price = current_prices[coin]
        trend, arrow = get_trend(coin)
        signal, signal_color = get_signal(coin)
        sparkline = create_sparkline(price_history[coin])
        holdings = portfolio[coin]["holdings"]
        avg_price = portfolio[coin]["avg_price"]
        
        # Calculate P&L
        if holdings > 0:
            pnl = (price - avg_price) / avg_price * 100
            pnl_color = "green" if pnl > 0 else "red"
            pnl_str = f"[{pnl_color}]{pnl:+.2f}%[/{pnl_color}]"
            holdings_str = f"{holdings:.4f}"
        else:
            pnl_str = "-"
            holdings_str = "0"
        
        price_str = f"${price:,.2f}" if price > 1 else f"${price:.4f}"
        
        table.add_row(
            coin,
            price_str,
            f"{arrow} {trend}",
            f"[{signal_color}]{signal}[/{signal_color}]",
            sparkline,
            holdings_str,
            pnl_str
        )
    
    # Portfolio summary
    portfolio_stats = calculate_portfolio_value()
    summary_text = Text()
    summary_text.append("💼 Portfolio Value: ", style="bold white")
    summary_text.append(f"${portfolio_stats['total_value']:,.2f}", style="bold cyan")
    summary_text.append(" | Cost Basis: ", style="bold white")
    summary_text.append(f"${portfolio_stats['total_cost']:,.2f}", style="bold white")
    summary_text.append(" | Total P&L: ", style="bold white")
    
    pnl_color = "green" if portfolio_stats['profit_pct'] > 0 else "red"
    summary_text.append(f"{portfolio_stats['profit_pct']:+.2f}%", style=f"bold {pnl_color}")
    
    summary_panel = Panel(summary_text, border_style="cyan")
    
    # Alerts
    alerts = []
    for coin in COINS:
        _, arrow = get_trend(coin)
        if arrow == "📉" and portfolio[coin]["holdings"] > 0:
            alerts.append(f"⚠️  {coin} trending down - consider stop-loss")
    
    if alerts:
        alert_text = "\n".join(alerts)
        alert_panel = Panel(alert_text, title="⚠️  Alerts", border_style="yellow")
    else:
        alert_panel = Panel("✅ No alerts", border_style="green")
    
    # Combine everything
    layout.split_column(
        Layout(table, size=len(COINS) + 4),
        Layout(summary_panel, size=3),
        Layout(alert_panel, size=4)
    )
    
    return layout


def simulate_random_trade():
    """Randomly simulate a trade for demonstration."""
    if random.random() > 0.95:  # 5% chance per update
        coin = random.choice(COINS)
        action = random.choice(["BUY", "SELL"])
        price = current_prices[coin]
        
        if action == "BUY":
            amount = random.uniform(0.01, 0.1)
            # Update portfolio
            old_holdings = portfolio[coin]["holdings"]
            old_avg = portfolio[coin]["avg_price"]
            new_holdings = old_holdings + amount
            portfolio[coin]["avg_price"] = (old_holdings * old_avg + amount * price) / new_holdings
            portfolio[coin]["holdings"] = new_holdings
            log_trade(coin, action, price, amount)
        elif action == "SELL" and portfolio[coin]["holdings"] > 0:
            amount = min(random.uniform(0.01, 0.05), portfolio[coin]["holdings"])
            portfolio[coin]["holdings"] -= amount
            log_trade(coin, action, price, amount)


def main():
    """Main dashboard loop."""
    initialize_csv_log()
    
    console.print("\n[bold cyan]🚀 Crypto Terminal Dashboard Starting...[/bold cyan]\n")
    console.print("[yellow]Press Ctrl+C to exit[/yellow]\n")
    
    time.sleep(1)
    
    try:
        with Live(create_dashboard(), refresh_per_second=1, console=console) as live:
            while True:
                update_prices()
                simulate_random_trade()
                live.update(create_dashboard())
                time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        console.print("\n\n[bold cyan]👋 Dashboard stopped.[/bold cyan]\n")
        portfolio_stats = calculate_portfolio_value()
        console.print(f"[bold white]Final Portfolio Value:[/bold white] [cyan]${portfolio_stats['total_value']:,.2f}[/cyan]")
        console.print(f"[bold white]Trades logged to:[/bold white] [cyan]{CSV_LOG_FILE}[/cyan]\n")


if __name__ == "__main__":
    main()
