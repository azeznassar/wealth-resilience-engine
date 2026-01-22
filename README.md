# 💸 Wealth Resilience Engine

> *"The first $100,000 is a bitch, but you gotta do it." — Charlie Munger*

![Dashboard Screenshot](./dashboard-preview.png)

## 🧠 The Philosophy (Why I built this)
Most calculators show you a happy 8% return forever. That's dangerous. I wanted to build something Howard Marks or Charlie Munger might actually approve of—something that focuses on avoiding ruin rather than just chasing returns.

## ⚡ Features

### 1. The Cone of Uncertainty (Monte Carlo)
Instead of a single "prediction," this renders a probability cloud (10th to 90th percentile).
* **Why:** Because the future is a distribution, not a line.
* **Tech:** Custom logic generating variable return arrays fed into Recharts.

### 2. "The Grind" Visualization
Munger famously said the first $100k is the hardest.
* **The Feature:** The chart line stays muted/grey until the portfolio crosses the $100k threshold.
* **The Vibe:** It visually validates the struggle of the early years before compound interest really kicks in.

### 3. The "Croupier's Cut" (Fee Drag)
Warren Buffett hates fees.
* **The Feature:** A dynamic "Lost to Fees" counter.
* **Reality Check:** You can see exactly how many thousands of dollars a "small" 1% expense ratio eats up over 25 years.

### 4. Stress Testing
* **Market Cycle Inputs:** Adjust starting valuations (High/Low P/E).
* **The "Black Swan" Switch:** Instantly simulate a 30% market crash in Year 5 to see if your plan survives.
