/**
 * Permacast Auto-Boost Script
 * Automates On-Chain Boost on BNB Smart Chain (Chain ID 56)
 * 
 * Contract: 0xD1A7EE28cAC084750e77CF0a4fc1123E6E7F9F15
 * Method: boostContent(string contentId, string contentType)
 * 
 * Usage: node boost.js
 * 
 * Requirements:
 *   - Node.js 18+
 *   - npm install ethers axios
 *   - private_keys.txt (one private key per line)
 */

import { ethers } from "ethers";
import axios from "axios";
import fs from "fs";
import chalk from "chalk";
import logUpdate from "log-update";

// Fix SSL/TLS issues with some BSC RPC nodes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ═══════════════════════════════════════════════════════════
//  Configuration
// ═══════════════════════════════════════════════════════════

const CONFIG = {
    CHAIN_ID: 56,
    RPC_URLS: [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.binance.org",
        "https://bsc-dataseed2.binance.org",
        "https://bsc-dataseed3.binance.org",
        "https://bsc-dataseed4.binance.org",
        "https://bsc-dataseed1.defibit.io",
        "https://bsc-dataseed2.defibit.io",
        "https://bsc-dataseed1.ninicoin.io",
        "https://bsc-dataseed2.ninicoin.io",
        "https://bsc-rpc.publicnode.com",
        "https://rpc.ankr.com/bsc",
    ],
    API_BASE: "https://admin.permacast.app/frontapi",
    BOOST_CONTRACT: "0xD1A7EE28cAC084750e77CF0a4fc1123E6E7F9F15",
    CURATOR_CONTRACT: "0x4165452f8F0956A0E57BF906Bf3832B4f8D24012",
    DELAY_BETWEEN_BOOSTS_MS: 3000,       // 3 sec between each boost
    DELAY_BETWEEN_WALLETS_MS: 5000,      // 5 sec between wallets
    MAX_BOOSTS_PER_WALLET: 50,           // max boosts per wallet run
    PRIVATE_KEYS_FILE: "private_keys.txt",
    LOG_FILE: "boost_report.txt",        // laporan boost
    LOOP_INTERVAL_HOURS: 24,             // ulangi setiap 24 jam
};

// ═══════════════════════════════════════════════════════════
//  Contract ABI (minimal)
// ═══════════════════════════════════════════════════════════

const BOOST_ABI = [
    {
        inputs: [
            { internalType: "string", name: "contentId", type: "string" },
            { internalType: "string", name: "contentType", type: "string" },
        ],
        name: "boostContent",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "string", name: "contentId", type: "string" },
        ],
        name: "cancelBoost",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];

const CURATOR_ABI = [
    {
        inputs: [],
        name: "activateCurator",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];

// ═══════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════

function wibNow() {
    return new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function formatTimestamp() {
    return wibNow();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════
//  Logger (Premium UI)
// ═══════════════════════════════════════════════════════════

function writeReport(text) {
    fs.appendFileSync(CONFIG.LOG_FILE, text + "\n", "utf8");
}

function printBanner() {
    console.log(chalk.magenta(`
 ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ 
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌      ▐░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█░▌    ▐░█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌ ▀▀▀▀█░█▀▀▀▀ 
▐░▌          ▐░▌          ▐░▌       ▐░▌▐░█░░▌  ▐░░█░▌▐░█  ▄▄▄▄  █░▌▐░█          ▐░█  ▄▄▄▄  █░▌     ▐░█▌      
▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█░▐░▌▐░▌░█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▀▀▀▀▀▀▀█░▌     ▐░█▌      
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░█░ ▐░▌ ░█░▌▐░█░░░░░░░█░▌▐░░░░░░░░░░░▌▐░█░░░░░░░█░▌     ▐░█▌      
 ▀▀▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀█░█▀▀ ▐░█░  ▐░  ░█░▌▐░█▀▀▀▀▀▀▀█░▌ ▀▀▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌     ▐░█▌      
          ▐░▌▐░▌          ▐░▌     ▐░▌  ▐░█░      ░█░▌▐░█       ▐░█          ▐░█  ▐░█       ▐░█▌     ▐░█▌      
 ▄▄▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█      ▐░█ ▐░█░      ░█░▌▐░█       ▐░█ ▄▄▄▄▄▄▄▄▄█░▌▐░█       ▐░█▌     ▐░█▌      
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░█       ▐░█▐░█░      ░█░▌▐░█       ▐░█▐░░░░░░░░░░░▌▐░█       ▐░█▌     ▐░█▌      
 ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀        ▀  ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀       ▀       
    `));
    console.log(chalk.gray('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('   🚀 Permacast v1.0.0 | Chain: BSC (56) | Auto-Boost System'));
    console.log(chalk.gray('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

function printCredit() {
    const c = chalk.magenta;
    console.log(c('  *==========================================*'));
    console.log(c('    > Built by: Noya-xen (Github)'));
    console.log(c('    > Follow me on X : @xinomixo'));
    console.log(c('  *==========================================*\n'));
}

const INFO = (p, m) => console.log(`${chalk.cyan(`[${wibNow()}]`)} ${chalk.blueBright(`[${p}]`)} ${m}`);
const OK = (p, m) => console.log(`${chalk.cyan(`[${wibNow()}]`)} ${chalk.greenBright(`[${p}]`)} ${m}`);
const WARN = (p, m) => console.log(`${chalk.cyan(`[${wibNow()}]`)} ${chalk.yellowBright(`[${p}]`)} ${m}`);
const ERR = (p, m) => console.log(`${chalk.cyan(`[${wibNow()}]`)} ${chalk.redBright(`[${p}]`)} ${m}`);

function printSummaryReport(results) {
    const success = results.filter(r => r.boosts > 0).length;
    const failed = results.filter(r => r.error).length;
    
    console.log(chalk.white('\n  ━━━━━━━━━━━━━━━━ SUMMARY ━━━━━━━━━━━━━━━━'));
    console.log(chalk.green(`  ✅ Total Wallet Sukses: ${success}`));
    console.log(chalk.red(`  ❌ Total Wallet Gagal : ${failed}`));
    console.log(chalk.blue(`  📊 Total Akun         : ${results.length}`));
    console.log(chalk.yellow(`  ⏱  Waktu Selesai     : ${wibNow()}`));
    console.log(chalk.white('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

async function createProvider() {
    const network = ethers.Network.from(CONFIG.CHAIN_ID);
    for (const rpcUrl of CONFIG.RPC_URLS) {
        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl, network, {
                staticNetwork: network,
            });
            // Test the connection
            await provider.getBlockNumber();
            OK("RPC", `Connected to ${rpcUrl}`);
            return provider;
        } catch (e) {
            WARN("RPC", `Failed: ${rpcUrl} - ${e.message?.substring(0, 60)}`);
        }
    }
    throw new Error("All BSC RPC endpoints failed");
}

// ═══════════════════════════════════════════════════════════
//  API Client
// ═══════════════════════════════════════════════════════════

class PermacastAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    headers() {
        return this.token
            ? { Authorization: `Bearer ${this.token}` }
            : {};
    }

    async login(walletAddress, signature, message) {
        const res = await axios.post(`${this.baseUrl}/auth/login-with-sign`, {
            wallet_address: walletAddress,
            signature,
            message,
        });
        if (res.data.code === 0 && res.data.data?.access_token) {
            this.token = res.data.data.access_token;
            return true;
        }
        throw new Error(res.data.message || "Login failed");
    }

    async getBoostRequests(limit = 100, skip = 0) {
        const res = await axios.get(`${this.baseUrl}/chain/kpi/boost-requests`, {
            params: { chain_id: CONFIG.CHAIN_ID, limit, skip },
        });
        return res.data;
    }

    async boostContent(walletAddress, contentId, contentType, txHash) {
        const res = await axios.post(
            `${this.baseUrl}/chain/interaction/boost`,
            {
                wallet_address: walletAddress,
                content_id: contentId,
                content_type: contentType,
                tx_hash: txHash,
                chain_id: CONFIG.CHAIN_ID,
            },
            { headers: this.headers() }
        );
        return res.data;
    }

    async checkBoostStatus(walletAddress, contentId) {
        const res = await axios.get(`${this.baseUrl}/chain/interaction/check`, {
            params: { wallet_address: walletAddress, content_id: contentId },
        });
        return res.data;
    }

    async checkCuratorStatus(walletAddress) {
        const res = await axios.get(
            `${this.baseUrl}/chain/curator/check/${walletAddress}`,
            { params: { chain_id: CONFIG.CHAIN_ID } }
        );
        return res.data;
    }

    async activateCurator(walletAddress, txHash) {
        const res = await axios.post(
            `${this.baseUrl}/chain/curator/activate`,
            {
                wallet_address: walletAddress,
                tx_hash: txHash,
                chain_id: CONFIG.CHAIN_ID,
            },
            { headers: this.headers() }
        );
        return res.data;
    }

    async getPointsBalance(walletAddress) {
        const res = await axios.get(`${this.baseUrl}/points/balance`, {
            params: { wallet_address: walletAddress },
            headers: this.headers(),
        });
        return res.data;
    }

    async getOverview() {
        const res = await axios.get(`${this.baseUrl}/chain/kpi/overview`, {
            params: { chain_id: CONFIG.CHAIN_ID },
        });
        return res.data;
    }
}

// ═══════════════════════════════════════════════════════════
//  Gather All Unique Content IDs from Boost History
// ═══════════════════════════════════════════════════════════

async function fetchAllContentIds(api) {
    const contentMap = new Map();
    let skip = 0;
    const batchSize = 100;

    INFO("FETCH", "Collecting content IDs from boost history...");

    while (true) {
        try {
            const res = await api.getBoostRequests(batchSize, skip);
            if (res.code !== 0 || !res.data || res.data.length === 0) break;

            for (const item of res.data) {
                if (!contentMap.has(item.content_id)) {
                    contentMap.set(item.content_id, item.content_type);
                }
            }

            if (res.data.length < batchSize) break;
            skip += batchSize;

            // Don't fetch too many pages
            if (skip > 2000) break;

            await sleep(500);
        } catch (e) {
            WARN("FETCH", `Failed at skip=${skip}: ${e.message}`);
            break;
        }
    }

    INFO("FETCH", `Found ${contentMap.size} unique content IDs`);
    return contentMap;
}

// ═══════════════════════════════════════════════════════════
//  Wallet Processor
// ═══════════════════════════════════════════════════════════

async function processWallet(privateKey, contentMap, walletIdx, totalWallets, sharedProvider) {
    const provider = sharedProvider;

    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address.toLowerCase();
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const prefix = `W${walletIdx}/${totalWallets} ${shortAddr}`;

    INFO(prefix, "═══ Starting wallet processing ═══");

    // Check balance
    const balance = await provider.getBalance(address);
    const bnbBalance = ethers.formatEther(balance);
    INFO(prefix, `BNB Balance: ${bnbBalance}`);

    if (parseFloat(bnbBalance) < 0.0001) {
        WARN(prefix, "Insufficient BNB balance, skipping...");
        return { address, boosts: 0, error: "Insufficient balance" };
    }

    // Login to API
    const api = new PermacastAPI(CONFIG.API_BASE);
    try {
        const timestamp = formatTimestamp();
        const message = `login at ${timestamp} by ${address}`;
        const signature = await wallet.signMessage(message);

        await api.login(address, signature, message);
        OK(prefix, "Logged in successfully");
    } catch (e) {
        ERR(prefix, `Login failed: ${e.message}`);
        return { address, boosts: 0, error: e.message };
    }

    // Check points balance (before)
    let pointsBefore = "N/A";
    try {
        const pts = await api.getPointsBalance(address);
        if (pts.code === 0) {
            pointsBefore = pts.data?.total_points ?? "N/A";
            INFO(prefix, `Current points: ${pointsBefore}`);
        }
    } catch (e) {
        WARN(prefix, `Could not fetch points: ${e.message}`);
    }

    // Check curator status and activate if needed
    try {
        const curatorRes = await api.checkCuratorStatus(address);
        if (curatorRes.code === 0 && !curatorRes.data?.is_curator) {
            INFO(prefix, "Not a curator yet, activating...");
            const curatorContract = new ethers.Contract(
                CONFIG.CURATOR_CONTRACT,
                CURATOR_ABI,
                wallet
            );
            const tx = await curatorContract.activateCurator();
            INFO(prefix, `Curator activation tx: ${tx.hash}`);
            const receipt = await tx.wait();
            OK(prefix, `Curator activated! Gas: ${receipt.gasUsed.toString()}`);

            // Report to API
            await api.activateCurator(address, tx.hash);
            await sleep(2000);
        } else {
            OK(prefix, "Already a curator ✓");
        }
    } catch (e) {
        WARN(prefix, `Curator check/activation: ${e.message}`);
    }

    // Boost content
    const boostContract = new ethers.Contract(
        CONFIG.BOOST_CONTRACT,
        BOOST_ABI,
        wallet
    );

    let boosted = 0;
    let skipped = 0;
    let failed = 0;
    const entries = Array.from(contentMap.entries());

    INFO(prefix, `Starting to boost ${Math.min(entries.length, CONFIG.MAX_BOOSTS_PER_WALLET)} content items...`);

    for (let i = 0; i < entries.length && boosted < CONFIG.MAX_BOOSTS_PER_WALLET; i++) {
        const [contentId, contentType] = entries[i];

        try {
            // Check if already boosted
            const status = await api.checkBoostStatus(address, contentId);
            if (status.code === 0 && status.data?.is_boosted) {
                skipped++;
                continue;
            }
        } catch {
            // If check fails, try boosting anyway
        }

        try {
            INFO(prefix, `[${boosted + 1}] Boosting: ${contentId} (${contentType})`);

            // Send on-chain transaction
            const tx = await boostContract.boostContent(contentId, contentType);
            INFO(prefix, `  TX sent: ${tx.hash}`);

            const receipt = await tx.wait();
            OK(prefix, `  Confirmed! Block: ${receipt.blockNumber}, Gas: ${receipt.gasUsed.toString()}`);

            // Report to API
            const apiRes = await api.boostContent(address, contentId, contentType, tx.hash);
            if (apiRes.code === 0) {
                OK(prefix, `  ✅ Boost recorded! +1 point`);
                boosted++;
            } else {
                WARN(prefix, `  API response: ${apiRes.message}`);
                boosted++; // Still count as on-chain boost was successful
            }

            await sleep(CONFIG.DELAY_BETWEEN_BOOSTS_MS);
        } catch (e) {
            const errMsg = e.message?.substring(0, 100) || "Unknown error";
            ERR(prefix, `  ❌ Boost failed: ${errMsg}`);
            failed++;

            // If gas-related error, stop for this wallet
            if (
                errMsg.includes("insufficient funds") ||
                errMsg.includes("gas required exceeds") ||
                errMsg.includes("nonce")
            ) {
                WARN(prefix, "Stopping due to critical error");
                break;
            }

            await sleep(2000);
        }
    }

    // Final points check (after)
    let pointsAfter = "N/A";
    try {
        const pts = await api.getPointsBalance(address);
        if (pts.code === 0) {
            pointsAfter = pts.data?.total_points ?? "N/A";
            OK(prefix, `Final points: ${pointsAfter}`);
        }
    } catch { }

    // Get final BNB balance
    let bnbAfter = "N/A";
    try {
        const bal = await provider.getBalance(address);
        bnbAfter = ethers.formatEther(bal);
    } catch { }

    INFO(prefix, `═══ Summary: ✅ ${boosted} boosted | ⏭ ${skipped} skipped | ❌ ${failed} failed | Points: ${pointsAfter} ═══`);
    return { address, boosts: boosted, skipped, failed, pointsBefore, pointsAfter, bnbBalance, bnbAfter };
}

// ═══════════════════════════════════════════════════════════
//  Single Run Cycle
// ═══════════════════════════════════════════════════════════

async function runCycle(cycleNum) {
    const cycleStart = formatTimestamp();

    console.log(`\n\x1b[35m╔═══════════════════════════════════════════════════╗`);
    console.log(`║  🚀 Permacast Auto-Boost — Session #${String(cycleNum).padEnd(13)}║`);
    console.log(`║  Chain: BNB Smart Chain (56)                      ║`);
    console.log(`║  Time: ${cycleStart}                     ║`);
    console.log(`╚═══════════════════════════════════════════════════╝\x1b[0m\n`);

    // Load private keys (re-read each cycle so you can add keys live)
    if (!fs.existsSync(CONFIG.PRIVATE_KEYS_FILE)) {
        ERR("MAIN", `File not found: ${CONFIG.PRIVATE_KEYS_FILE}`);
        return;
    }

    const keys = fs
        .readFileSync(CONFIG.PRIVATE_KEYS_FILE, "utf8")
        .split("\n")
        .map((k) => k.trim())
        .filter((k) => k.length > 0 && !k.startsWith("#"));

    if (keys.length === 0) {
        ERR("MAIN", "No private keys found in file");
        return;
    }

    INFO("MAIN", `Loaded ${keys.length} wallet(s)`);

    // Fetch content IDs from public boost history
    const api = new PermacastAPI(CONFIG.API_BASE);
    const contentMap = await fetchAllContentIds(api);

    if (contentMap.size === 0) {
        ERR("MAIN", "No content IDs found to boost");
        flushLogs();
        return;
    }

    // Show overview
    try {
        const overview = await api.getOverview();
        if (overview.code === 0) {
            INFO("MAIN", `Platform stats: ${overview.data.UAW} users | ${overview.data.total_boosts} total boosts | ${overview.data.active_users} active`);
        }
    } catch { }

    // Create shared provider (try multiple RPCs)
    INFO("MAIN", "Connecting to BSC RPC...");
    let provider;
    try {
        provider = await createProvider();
    } catch (e) {
        ERR("MAIN", `Cannot connect to BSC: ${e.message}`);
        flushLogs();
        return;
    }

    // Process each wallet
    const results = [];
    for (let i = 0; i < keys.length; i++) {
        try {
            const result = await processWallet(keys[i], contentMap, i + 1, keys.length, provider);
            results.push(result);
        } catch (e) {
            ERR("MAIN", `Wallet ${i + 1} crashed: ${e.message}`);
            results.push({ address: "unknown", boosts: 0, error: e.message });
        }

        if (i < keys.length - 1) {
            INFO("MAIN", `Waiting ${CONFIG.DELAY_BETWEEN_WALLETS_MS / 1000}s before next wallet...`);
            await sleep(CONFIG.DELAY_BETWEEN_WALLETS_MS);
        }
    }

    // ─── Session Summary (console + file) ───
    const cycleEnd = formatTimestamp();
    let totalBoosts = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    // Build summary lines
    const summaryLines = [];
    summaryLines.push("");
    summaryLines.push("─".repeat(60));
    summaryLines.push(`  SESSION #${cycleNum} REPORT`);
    summaryLines.push(`  Started : ${cycleStart}`);
    summaryLines.push(`  Finished: ${cycleEnd}`);
    summaryLines.push(`  Content available: ${contentMap.size}`);
    summaryLines.push("─".repeat(60));
    summaryLines.push("");

    for (const r of results) {
        const boosts = r.boosts || 0;
        const skipped = r.skipped || 0;
        const failed = r.failed || 0;
        totalBoosts += boosts;
        totalSkipped += skipped;
        totalFailed += failed;

        if (r.error && boosts === 0) {
            summaryLines.push(`  ❌ ${r.address}`);
            summaryLines.push(`     Error: ${r.error}`);
        } else {
            summaryLines.push(`  ✅ ${r.address}`);
            summaryLines.push(`     Boosted: ${boosts} | Skipped: ${skipped} | Failed: ${failed}`);
            summaryLines.push(`     Points : ${r.pointsBefore ?? "N/A"} → ${r.pointsAfter ?? "N/A"}`);
            summaryLines.push(`     BNB    : ${r.bnbBalance ?? "N/A"} → ${r.bnbAfter ?? "N/A"}`);
        }
        summaryLines.push("");
    }

    summaryLines.push("─".repeat(60));
    summaryLines.push(`  TOTAL: ✅ ${totalBoosts} boosted | ⏭ ${totalSkipped} skipped | ❌ ${totalFailed} failed`);
    summaryLines.push("─".repeat(60));
    summaryLines.push("");

    // Print to console with color
    console.log("\x1b[35m" + summaryLines.join("\n") + "\x1b[0m");

    // Write ONLY summary to report file
    writeReport(summaryLines.join("\n"));

    INFO("MAIN", `Report saved to ${CONFIG.LOG_FILE}`);
    printSummaryReport(results);
    return { totalBoosts, totalSkipped, totalFailed };
}

// ═══════════════════════════════════════════════════════════
//  Main Loop (repeats every 24 hours)
// ═══════════════════════════════════════════════════════════

async function main() {
    let cycle = 1;

    while (true) {
        try {
            if (cycle === 1) {
                printBanner();
                printCredit();
            }
            await runCycle(cycle);
        } catch (e) {
            ERR("LOOP", `Session #${cycle} error: ${e.message}`);
            writeReport(`[${formatTimestamp()}] [LOOP] FATAL: ${e.message}`);
        }

        cycle++;

        // Calculate next run time
        const nextRun = new Date(Date.now() + CONFIG.LOOP_INTERVAL_HOURS * 60 * 60 * 1000);
        const nextRunStr = formatTimestamp.call ? nextRun.toLocaleString() : nextRun.toString();

        console.log(`\n\x1b[33m╔═══════════════════════════════════════════════════╗`);
        console.log(`║  ⏳ Next session in ${CONFIG.LOOP_INTERVAL_HOURS} hours                       ║`);
        console.log(`║  📅 ${nextRunStr.padEnd(44)}║`);
        console.log(`║  Press Ctrl+C to stop                             ║`);
        console.log(`╚═══════════════════════════════════════════════════╝\x1b[0m\n`);

        // Sleep for 24 hours
        await sleep(CONFIG.LOOP_INTERVAL_HOURS * 60 * 60 * 1000);
    }
}

main().catch((e) => {
    ERR("MAIN", `Fatal error: ${e.message}`);
    writeReport(`[${formatTimestamp()}] [FATAL] ${e.message}`);
    console.error(e);
    process.exit(1);
});
