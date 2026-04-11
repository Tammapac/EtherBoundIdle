# EtherBound Idle — Load Test Bot Runner

Simulates realistic player behavior for stress testing the game backend.

## What the bots do

Each bot:
1. Registers a new account / logs in
2. Creates a character (random class)
3. Connects via Socket.IO + selects character
4. Fights enemies every 5s (configurable)
5. Claims idle progress every 60s
6. Sends chat messages every 30s

## Usage

```bash
cd load-test
npm install

# 10 bots, 5 minutes (default)
node bot-runner.js

# 100 bots ramped up (500ms between each)
node bot-runner.js --bots 100 --ramp

# 500 bots, fast ramp, 10 min duration
node bot-runner.js --bots 500 --ramp --ramp-delay 200 --duration 600000

# Custom server URL
node bot-runner.js --url http://your-server:3000 --bots 50

# Verbose mode (see per-bot actions)
node bot-runner.js --bots 10 --verbose
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--url` | `http://localhost:3000` | Server URL |
| `--bots` | `10` | Number of bot clients |
| `--ramp` | `false` | Ramp up bots gradually |
| `--ramp-delay` | `500` | Ms between each bot spawn (with --ramp) |
| `--fight-interval` | `5000` | Ms between fights per bot |
| `--idle-interval` | `60000` | Ms between idle claims |
| `--chat-interval` | `30000` | Ms between chat messages |
| `--duration` | `300000` | Total test duration in ms |
| `--verbose` | `false` | Log per-bot actions |

## Metrics reported

Every 5 seconds:
- Active bots / WebSocket connections
- Total requests and error rate
- Fight count
- Latency: avg, p50, p95, p99, max

Final report includes full summary.

## Environment

Set `SERVER_URL` env var or use `--url` flag.
