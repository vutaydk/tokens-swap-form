const EXCHANGE_RATE_API_URL = 'https://interview.switcheo.com/prices.json';
const ICON_BASE_URL = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/';

// State
let tokens = [];
let fromToken = null;
let toToken = null;
let activeSelector = null; // 'from' or 'to'
let exchangeRateLastUpdated;
const EXCHANGE_RATE_MAX_AGE = 60 * 1000 * 1; // 5 minutes

// DOM Elements
let form;
let inputAmount;
let outputAmount;
let fromTokenSelector;
let toTokenSelector;
let fromTokenIcon;
let toTokenIcon;
let fromTokenSymbol;
let toTokenSymbol;
let fromAmountUsd;
let toAmountUsd;
let exchangeRateInfo;
let swapArrowBtn;
let loader;
let formError;

let tokenModal;
let closeModal;
let tokenSearch;
let tokenList;

function loadDOM() {
  form = document.getElementById('swap-form');
  inputAmount = document.getElementById('input-amount');
  outputAmount = document.getElementById('output-amount');
  fromTokenSelector = document.getElementById('from-token-selector');
  toTokenSelector = document.getElementById('to-token-selector');
  fromTokenIcon = document.getElementById('from-token-icon');
  toTokenIcon = document.getElementById('to-token-icon');
  fromTokenSymbol = document.getElementById('from-token-symbol');
  toTokenSymbol = document.getElementById('to-token-symbol');
  fromAmountUsd = document.getElementById('from-amount-usd');
  toAmountUsd = document.getElementById('to-amount-usd');
  exchangeRateInfo = document.getElementById('exchange-rate-info');
  swapArrowBtn = document.getElementById('swap-arrow-btn');
  loader = document.getElementsByClassName("loader")[0];
  formError = document.getElementById('form-error');

  tokenModal = document.getElementById('token-modal');
  closeModal = document.getElementById('close-modal');
  tokenSearch = document.getElementById('token-search');
  tokenList = document.getElementById('token-list');
}

function addEventLiseners() {
  inputAmount.addEventListener('input', () => calculateValues('from'));
  outputAmount.addEventListener('input', () => calculateValues('to'));

  fromTokenSelector.addEventListener('click', () => openModal('from'));
  toTokenSelector.addEventListener('click', () => openModal('to'));

  closeModal.addEventListener('click', closeModalHandler);
  tokenModal.addEventListener('click', (e) => {
    if (e.target === tokenModal) closeModalHandler();
  });

  tokenSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = tokens.filter(t => t.symbol.toLowerCase().includes(term));
    renderTokenList(filtered);
  });

  swapArrowBtn.addEventListener('click', () => {
    const tempToken = fromToken;
    fromToken = toToken;
    toToken = tempToken;

    updateTokenUI('from', fromToken);
    updateTokenUI('to', toToken);
    // Recalculate using the input amount
    calculateValues('from');
  });
}

async function updateExchangeRate() {
  try {
    loader.style.display = 'block';
    const exchangeRateResponse = await fetch(EXCHANGE_RATE_API_URL);
    const exchangeRateData = await exchangeRateResponse.json();
    exchangeRateLastUpdated = new Date();

    // Process and deduplicate tokens
    const tokenMap = new Map();
    exchangeRateData.forEach(item => {
      // Keep the latest or just the first valid one we encounter. Let's just overwrite, keeping the latest one in the array.
      if (item.price && item.currency) {
        tokenMap.set(item.currency, {
          symbol: item.currency,
          price: item.price,
          date: item.date
        });
      }
    });

    tokens = Array.from(tokenMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  } catch (error) {
    console.error("Error fetching prices", error);
    formError.textContent = "Failed to load token prices. Please refresh.";
  } finally {
    loader.style.display = 'none';
  }
}

// Initialize
async function init() {
  loadDOM();
  addEventLiseners();

  await updateExchangeRate();

  // Set default tokens (ETH to USDC if available, otherwise just use whatever is first)
  if (tokens.length >= 2) {
    fromToken = tokens.find(t => t.symbol === 'ETH') || tokens[0];
    toToken = tokens.find(t => t.symbol === 'USDC') || tokens[1];
  }

  updateTokenUI('from', fromToken);
  updateTokenUI('to', toToken);

  renderTokenList(tokens);
}

function updateTokenUI(side, token) {
  if (!token) return;
  const iconEl = side === 'from' ? fromTokenIcon : toTokenIcon;
  const symbolEl = side === 'from' ? fromTokenSymbol : toTokenSymbol;

  iconEl.src = `${ICON_BASE_URL}${token.symbol}.svg`;
  iconEl.style.display = 'block';
  iconEl.onerror = () => {
    iconEl.src = `https://via.placeholder.com/24/293249/FFFFFF?text=${token.symbol.charAt(0)}`;
  };
  symbolEl.textContent = token.symbol;

  calculateValues(side === 'from' ? 'from' : 'to'); // trigger recalculation
}

async function calculateValues(source) {
  if (!validateForm()) return;

  const now = new Date();
  if (!exchangeRateLastUpdated || (now - exchangeRateLastUpdated) >= EXCHANGE_RATE_MAX_AGE) {
    await updateExchangeRate();
  }
  if (!fromToken || !toToken) return;

  const fromPrice = fromToken.price;
  const toPrice = toToken.price;

  if (source === 'from') {
    const fromVal = parseFloat(inputAmount.value);
    if (!isNaN(fromVal) && fromVal > 0) {
      const usdValue = fromVal * fromPrice;
      const toVal = usdValue / toPrice;

      // Update output amount to a nice string without trailing zeros
      let toValStr = toVal.toFixed(6);
      if (toValStr.includes('.')) {
        toValStr = toValStr.replace(/0+$/, '').replace(/\.$/, '');
      }
      outputAmount.value = toValStr;

      fromAmountUsd.textContent = `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      toAmountUsd.textContent = `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      outputAmount.value = '';
      fromAmountUsd.textContent = '$0.00';
      toAmountUsd.textContent = '$0.00';
    }
  } else if (source === 'to') {
    const toVal = parseFloat(outputAmount.value);
    if (!isNaN(toVal) && toVal > 0) {
      const usdValue = toVal * toPrice;
      const fromVal = usdValue / fromPrice;

      let fromValStr = fromVal.toFixed(6);
      if (fromValStr.includes('.')) {
        fromValStr = fromValStr.replace(/0+$/, '').replace(/\.$/, '');
      }
      inputAmount.value = fromValStr;

      toAmountUsd.textContent = `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      fromAmountUsd.textContent = `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      inputAmount.value = '';
      fromAmountUsd.textContent = '$0.00';
      toAmountUsd.textContent = '$0.00';
    }
  }

  // Update exchange rate info
  const rate = fromPrice / toPrice;
  let rateStr = rate.toFixed(6);
  if (rateStr.includes('.')) {
    rateStr = rateStr.replace(/0+$/, '').replace(/\.$/, '');
  }
  exchangeRateInfo.textContent = `1 ${fromToken.symbol} = ${rateStr} ${toToken.symbol}`;
}

function validateForm() {
  formError.textContent = '';
  const fromVal = parseFloat(inputAmount.value);

  if (!fromToken || !toToken) {
    return false;
  }

  if (!inputAmount.value || isNaN(fromVal)) {
    return false;
  }

  if (fromVal <= 0) {
    formError.textContent = 'Amount must be greater than zero';
    return false;
  }

  if (fromToken.symbol === toToken.symbol) {
    formError.textContent = 'Cannot swap the same token';
    return false;
  }
  return true;
}

function openModal(side) {
  activeSelector = side;
  tokenModal.style.display = 'flex';
  tokenSearch.value = '';
  tokenSearch.focus();
  renderTokenList(tokens);
}

function closeModalHandler() {
  tokenModal.style.display = 'none';
  activeSelector = null;
}

function renderTokenList(list) {
  tokenList.innerHTML = '';

  if (list.length === 0) {
    tokenList.innerHTML = '<div style="text-align:center; padding: 20px; color: #98A1C0;">No tokens found</div>';
    return;
  }

  list.forEach(token => {
    // Disable selecting the same token
    const isSelected =
      (activeSelector === 'from' && toToken && toToken.symbol === token.symbol) ||
      (activeSelector === 'to' && fromToken && fromToken.symbol === token.symbol);

    const item = document.createElement('div');
    item.className = `token-item ${isSelected ? 'opacity-50 cursor-not-allowed' : ''}`;

    // Format price
    const priceFormatted = `$${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;

    item.innerHTML = `
      <img src="${ICON_BASE_URL}${token.symbol}.svg" alt="${token.symbol}" class="token-icon-img" onerror="this.src='https://via.placeholder.com/36/293249/FFFFFF?text=${token.symbol.charAt(0)}'" />
      <div class="flex flex-col">
        <span class="text-base font-medium text-white">${token.symbol}</span>
        <span class="text-xs text-[#98A1C0]">${token.symbol}</span>
      </div>
      <div class="ml-auto text-right flex flex-col">
        <span class="text-base text-white">${priceFormatted}</span>
      </div>
    `;

    item.addEventListener('click', () => {
      if (isSelected) return;

      if (activeSelector === 'from') {
        fromToken = token;
        updateTokenUI('from', token);
      } else {
        toToken = token;
        updateTokenUI('to', token);
      }
      closeModalHandler();
    });

    tokenList.appendChild(item);
  });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
