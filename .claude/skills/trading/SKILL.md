---
name: trading
description: Building and analyzing trading features, strategies, and market data integrations. Use when the user wants to implement trading logic, backtest strategies, integrate market data APIs, compute technical indicators, or work with portfolio/position tracking.
---

# Trading Skill

Help implement, analyze, and validate trading features — strategies, market
data ingestion, indicators, backtests, and portfolio tracking.

## When to use

Trigger this skill when the user asks to:
- Integrate a market data source (Alpaca, Binance, Coinbase, Polygon, Yahoo
  Finance, IEX Cloud, etc.)
- Implement a trading strategy (momentum, mean-reversion, breakout, pairs,
  market-making)
- Compute technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR)
- Build a backtester or paper-trading harness
- Track positions, P&L, orders, or execution reports
- Wire up risk controls (position limits, stop-loss, max drawdown)

## Workflow

Make a todo list for the tasks below and work through them one at a time.

### 1. Clarify scope

Before writing code, confirm the essentials with the user if not specified:
- **Asset class**: equities, crypto, FX, futures, options
- **Venue / data source**: which broker or exchange API
- **Mode**: live trading, paper trading, or backtest only
- **Timeframe**: tick, 1m, 5m, 1h, 1d
- **Authentication**: how API keys will be supplied (env vars, secrets manager)

Never assume real money is at stake. Default to paper/sandbox endpoints unless
the user explicitly asks for live trading.

### 2. Design the data model

Typical entities:
- `Instrument` — symbol, exchange, tick size, lot size
- `Bar` / `Quote` / `Trade` — OHLCV or L1/L2 market data
- `Order` — side, type, qty, price, status, timestamps
- `Position` — symbol, qty, avg price, realized/unrealized P&L
- `Strategy` — parameters, state, signal generator

Prefer decimal types (not float) for prices and quantities to avoid rounding
errors. In TypeScript use `string` or a decimal library; in Python use
`decimal.Decimal`.

### 3. Implement in layers

Build from the bottom up so each layer is testable in isolation:

1. **Data layer** — fetch + normalize market data. Cache where appropriate.
2. **Indicator layer** — pure functions over arrays of bars. Easy to unit test.
3. **Strategy layer** — consumes indicators, emits signals.
4. **Execution layer** — translates signals to orders. Honors risk limits.
5. **Portfolio layer** — tracks positions and P&L from fills.

Keep each layer free of side effects where possible.

### 4. Risk controls

Every strategy must enforce:
- Max position size per symbol
- Max total exposure / leverage
- Stop-loss or max drawdown kill-switch
- Rate limits on order submission

Fail closed: if a risk check errors, block the trade rather than letting it
through.

### 5. Test before running

- Unit tests for indicators (known inputs → known outputs)
- Replay test for the strategy over historical bars
- Dry-run against the broker's paper endpoint
- Smoke test order placement + cancellation before enabling the strategy loop

### 6. Secrets and compliance

- Never commit API keys. Use `.env` + `.gitignore`, or a secrets manager.
- Log order intents and fills to an audit trail.
- Surface a clear "live vs paper" indicator in any UI.
- Warn the user that this code is not financial advice and past performance
  does not guarantee future results.

## Common pitfalls

- **Look-ahead bias** in backtests — only use bars available at decision time
- **Survivorship bias** — delisted tickers missing from the universe
- **Fee / slippage modeling** — backtests that ignore costs over-estimate P&L
- **Timezone bugs** — market data and exchange clocks often disagree; store
  everything in UTC and convert at the edges
- **Floating point** — always use decimals for prices and quantities
- **Rate limits** — most broker APIs throttle; batch requests and back off
- **Partial fills** — an order filled 100/500 is still open; handle it

## Reference indicator snippets

### Simple moving average (TypeScript)

```ts
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}
```

### RSI (Python)

```python
def rsi(closes: list[float], period: int = 14) -> list[float | None]:
    gains, losses = [], []
    out: list[float | None] = [None] * len(closes)
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0))
        losses.append(max(-diff, 0))
        if i >= period:
            avg_g = sum(gains[-period:]) / period
            avg_l = sum(losses[-period:]) / period
            rs = avg_g / avg_l if avg_l else float("inf")
            out[i] = 100 - 100 / (1 + rs)
    return out
```

## Wrap up

When finished, summarize for the user:
- What was built (data, indicators, strategy, execution, portfolio)
- Which endpoints it talks to (paper vs live)
- Risk controls in place
- Test coverage and any gaps
- Clear reminder that this is not financial advice
