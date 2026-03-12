# 🚀 Permacast Auto-Boost Bot

A powerful automation script for the **Permacast** platform on BNB Smart Chain. This bot automates the `boostContent` on-chain interaction to help you earn points efficiently across multiple wallets.

Built with performance and reliability in mind, following the **Airdrop Bot & Web3 Automation** standards.

---

## ✨ Features

- **Multi-Wallet Support**: Processes multiple accounts from `private_keys.txt`.
- **Auto-Curator Activation**: Automatically detects if a wallet is not yet a curator and activates it.
- **Smart Boosting**: Fetches unique content IDs from global history to ensure you boost active content.
- **Anti-Sybil & Rate Limiting**: Random delays and specific intervals between actions to mimic human behavior.
- **Premium Terminal UI**: Beautiful, color-coded logs using `chalk` for real-time monitoring.
- **Automatic Report Generation**: Saves session summaries to `boost_report.txt`.

---

## 🛠 Prerequisites

- **Node.js** (v18 or higher)
- **BNB (BSC)** for gas fees (minimal amount needed per boost).

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Noya-xen/Permacast.git
cd Permacast
npm install
```

### 2. Configuration

Create a file named `private_keys.txt` in the root directory and add your private keys, one per line:

```text
0xabc...123
0xdef...456
```

> [!IMPORTANT]
> Never share your `private_keys.txt` or upload it to any public repository!

### 3. Usage

Run the script:

```bash
npm start
```

The script will:
1. Connect to the most stable BSC RPC.
2. Login to Permacast API for each wallet.
3. Check balance and curator status.
4. Execute boosts for unique content.
5. Repeat every 24 hours automatically.

---

## 📊 Logging & Reports

- **Console**: High-quality color-coded logs.
- **File**: `boost_report.txt` contains a detailed summary of every session.

---

## 🛡 Disclaimer

This tool is for educational purposes only. Use it at your own risk. The developer is not responsible for any losses or platform bans.

---

**Developed with ❤️ by [Noya-xen](https://github.com/Noya-xen)**
