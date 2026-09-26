/* ============================================================
 * shity.js — shared frontend library for the Shity platform pages
 * (Shity Launchpad, Shity Lending, Shity DEX).
 *
 * $0-to-us model: we deploy nothing. Every deploy below is signed
 * and paid for by the VISITOR's own wallet. Protocol fees are
 * hardcoded in the contracts, so they flow to the project addresses
 * no matter who deploys.
 *
 * Requires ethers.js v5 (UMD) loaded before this file for EVM flows.
 * Solana status uses raw JSON-RPC (no library). TON uses the
 * TON Connect UI bundle loaded per-page.
 * ============================================================ */
(function (global) {
  'use strict';

  // Complete a Phantom mobile deep-link redirect if we just came back
  // from the Phantom app (never breaks page load).
  try { phantomHandleRedirect(); } catch (e) {}

  var FEE_EVM = '0x67de87A2419522265f7d7b9F50F3810b3A2111d3';
  var FEE_SOL = '3riHbnaAnERLB5khbfHtQpiDBVVvKikwX7Ee6AaE7Ls4';
  var FEE_TON = 'UQBhJAV0TcB7lYCLb7nvbwmFis0VLqBYX04t6FdVw5T853rE';

  /* ---------------- chain registry ---------------- */
  // rpc values were live-verified (eth_chainId) on 2026-09-25/26.
  var CHAINS = {
    base:      { label: 'Base', chainId: 8453,
                 currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                 rpc: 'https://mainnet.base.org',
                 explorer: 'https://basescan.org' },
    ethereum:  { label: 'Ethereum', chainId: 1,
                 currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                 rpc: 'https://cloudflare-eth.com',
                 explorer: 'https://etherscan.io' },
    bsc:       { label: 'BNB Chain', chainId: 56,
                 currency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                 rpc: 'https://bsc-dataseed.binance.org',
                 explorer: 'https://bscscan.com' },
    arbitrum:  { label: 'Arbitrum One', chainId: 42161,
                 currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                 rpc: 'https://arb1.arbitrum.io/rpc',
                 explorer: 'https://arbiscan.io' },
    polygon:   { label: 'Polygon', chainId: 137,
                 currency: { name: 'POL', symbol: 'POL', decimals: 18 },
                 rpc: 'https://polygon-bor-rpc.publicnode.com',
                 explorer: 'https://polygonscan.com' },
    robinhood: { label: 'Robinhood Chain', chainId: 4663,
                 currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                 rpc: 'https://rpc.mainnet.chain.robinhood.com',
                 explorer: null }, // no public explorer known yet
    ink:       { label: 'Ink', chainId: 57073,
                 currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                 rpc: 'https://rpc-gel.inkonchain.com',
                 explorer: 'https://explorer.inkonchain.com' },
    monad:     { label: 'Monad', chainId: 143,
                 currency: { name: 'MON', symbol: 'MON', decimals: 18 },
                 rpc: 'https://rpc.monad.xyz',
                 explorer: null }, // no public explorer known yet
    hyperevm:  { label: 'HyperEVM', chainId: 999,
                 currency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
                 rpc: 'https://rpc.hyperliquid.xyz/evm',
                 explorer: null }, // no public explorer known yet
    sonic:     { label: 'Sonic', chainId: 146,
                 currency: { name: 'Sonic', symbol: 'S', decimals: 18 },
                 rpc: 'https://rpc.soniclabs.com',
                 explorer: 'https://sonicscan.org' },
    sei:       { label: 'Sei', chainId: 1329,
                 currency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
                 rpc: 'https://evm-rpc.sei-apis.com',
                 explorer: 'https://seitrace.com' },
    gnosis:    { label: 'Gnosis', chainId: 100,
                 currency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
                 rpc: 'https://rpc.gnosischain.com',
                 explorer: 'https://gnosisscan.io' },
    avalanche: { label: 'Avalanche', chainId: 43114,
                 currency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
                 rpc: 'https://api.avax.network/ext/bc/C/rpc',
                 explorer: 'https://snowtrace.io' }
  };

  /* ---------------- product definitions ---------------- */
  // fee: human-readable creation fee per chain (launchpad). Lending and
  // DEX fees are chain-independent and documented on their pages.
  var PRODUCTS = {
    launchpad: {
      title: 'Shity Launchpad',
      evmChains: ['base', 'ethereum', 'bsc', 'arbitrum', 'polygon',
                  'robinhood', 'ink', 'monad', 'hyperevm',
                  'sonic', 'sei', 'gnosis', 'avalanche'],
      fee: { base: '0.025 ETH', ethereum: '0.025 ETH', bsc: '0.1 BNB',
             arbitrum: '0.025 ETH', polygon: '50 POL', robinhood: '0.025 ETH',
             ink: '0.025 ETH', monad: '2,500 MON', hyperevm: '0.75 HYPE',
             sonic: '10,000 S', sei: '900 SEI', gnosis: '65 xDAI',
             avalanche: '6 AVAX' },
      // creation fee in native units (all 18 decimals) for the tx value
      feeWei: { base: '0.025', ethereum: '0.025', bsc: '0.1',
                arbitrum: '0.025', polygon: '50', robinhood: '0.025',
                ink: '0.025', monad: '2500', hyperevm: '0.75',
                sonic: '10000', sei: '900', gnosis: '65', avalanche: '6' },
      solana: { programId: 'p8tZEQZEZhSt8A9m1fZjSM6n8AAXTxxm7u6i8qMQA3n',
                fee: '0.10 SOL',
                soFile: '/assets/deploys/solana/shity_launchpad.so' },
      ton: { fee: '15 TON',
             saleBoc: '/assets/deploys/ton/Launchpad_Sale.code.boc',
             factoryBoc: '/assets/deploys/ton/Launchpad_LaunchpadFactory.code.boc' },
      // One shared TokenFactory + LaunchpadFactory per chain. Null until
      // the one-time deployment lands; the page shows an honest notice then.
      deployments: { base: { tokenFactory: '0x28edf866303a5B2B244621Cad30655a1453F02d2', saleFactory: '0x72B24871946cE4A5d0Af29F32C29636f47171a22' }, ethereum: null, bsc: null, arbitrum: null, polygon: { tokenFactory: '0xE376bb19978B66900Da774A6dD31bac42a436940', saleFactory: '0x83283EaCB77e391957aAdd7f7Ec9A47cc0704910' }, robinhood: null, ink: null, monad: { tokenFactory: '0x8C9D2e9Ac2641eA1E68F77dbdf4a12EEaA813b4D', saleFactory: '0x842039105b59FFFdd2f321E639d1B0D1Cd805469' }, hyperevm: { tokenFactory: '0x83283EaCB77e391957aAdd7f7Ec9A47cc0704910', saleFactory: '0x8C9D2e9Ac2641eA1E68F77dbdf4a12EEaA813b4D' }, sonic: null, sei: null, gnosis: null, avalanche: { tokenFactory: '0x8C9D2e9Ac2641eA1E68F77dbdf4a12EEaA813b4D', saleFactory: '0x842039105b59FFFdd2f321E639d1B0D1Cd805469' } }
    },
    lending: {
      title: 'Shity Lending',
      evmChains: ['base', 'ethereum', 'bsc', 'arbitrum', 'polygon',
                  'robinhood', 'ink', 'monad', 'hyperevm',
                  'sonic', 'sei', 'gnosis', 'avalanche'],
      fee: 'No creation fee. 2.5% of borrower interest goes to the protocol.',
      solana: { programId: null, // native program: deployer picks the address
                fee: 'No creation fee. 2.5% of borrower interest.',
                soFile: '/assets/deploys/solana/shity_lending.so' },
      // One shared LendingPoolFactory per chain. Null until the one-time
      // deployment lands; the page shows an honest notice then.
      deployments: { base: { factory: '0x842039105b59FFFdd2f321E639d1B0D1Cd805469' }, ethereum: null, bsc: null, arbitrum: null, polygon: { factory: '0xb647b611A59E2A0aa147D4A51ac80DEe7283f30D' }, robinhood: null, ink: null, monad: { factory: '0x83283EaCB77e391957aAdd7f7Ec9A47cc0704910' }, hyperevm: null, sonic: null, sei: null, gnosis: null, avalanche: { factory: '0x83283EaCB77e391957aAdd7f7Ec9A47cc0704910' } }
    },
    dex: {
      title: 'Shity DEX',
      evmChains: ['base', 'ethereum', 'bsc', 'arbitrum',
                  'ink', 'monad', 'hyperevm',
                  'sonic', 'sei', 'gnosis', 'avalanche'],
      fee: 'No creation fee. Swap fee is set per chain, from 0.005%. 1/6th of the fee to the protocol.',
      // swap fee per chain (percent string); cheaper chains get the lower fee
      fees: { base: '0.005%', monad: '0.005%', hyperevm: '0.005%', ink: '0.005%',
              arbitrum: '0.01%', bsc: '0.05%', ethereum: '0.1%' },
      // canonical wrapped-native token per chain (router constructor arg)
      weth: { base: '0x4200000000000000000000000000000000000006',
              ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
              bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
              arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
              ink: '0x4200000000000000000000000000000000000006',
              monad: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
              hyperevm: '0x5555555555555555555555555555555555555555',
              sonic: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
              sei: '0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7',
              gnosis: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
              avalanche: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' },
      solana: { programId: '5xCKds3qiUBsGmxD75hH6MaRqNXRYn1dXjdAiTmwbbzj',
                fee: 'No creation fee. 0.3% per swap, 1/6th to the protocol.',
                soFile: '/assets/deploys/solana/shity_dex.so' },
      // One shared DEX deployment per chain (factory + router). Null until
      // the one-time deployment lands; the page shows an honest notice then.
      deployments: { base: null, ethereum: null, bsc: null, arbitrum: null, ink: null, monad: { factory: '0x28edf866303a5B2B244621Cad30655a1453F02d2', router: '0x72B24871946cE4A5d0Af29F32C29636f47171a22' }, hyperevm: { factory: '0x842039105b59FFFdd2f321E639d1B0D1Cd805469', router: '0x28edf866303a5B2B244621Cad30655a1453F02d2' }, sonic: null, sei: null, gnosis: null, avalanche: { factory: '0x28edf866303a5B2B244621Cad30655a1453F02d2', router: '0x72B24871946cE4A5d0Af29F32C29636f47171a22' } }
    },
    auction: {
      title: 'Shity Auction',
      evmChains: ['avalanche'],
      fee: '2% marketplace fee on the sale price, taken when the seller is paid.',
      // USDC per chain (6 decimals)
      usdc: { avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
      // One shared auction escrow contract per chain. Null until the one-time
      // deployment lands; the page shows an honest notice then.
      deployments: { avalanche: null }
    }
  };

  /* Minimal ABIs for trading against a live DEX deployment. */
  var ERC20_ABI = [
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
  ];
  var PAIR_ABI = [
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ];
  /* Minimal ABI for using a live lending pool (supply / borrow / repay). */
  var POOL_ABI = [
    'function token() view returns (address)',
    'function supplyRatePerYear() view returns (uint256)',
    'function borrowRatePerYear() view returns (uint256)',
    'function utilization() view returns (uint256)',
    'function cash() view returns (uint256)',
    'function supplyBalance(address) view returns (uint256)',
    'function borrowBalance(address) view returns (uint256)',
    'function maxBorrow(address) view returns (uint256)',
    'function getAccountSnapshot(address) view returns (uint256 receiptBal, uint256 borBal, uint256 supplyUnderlying, uint256 healthFactor)',
    'function supply(uint256 amount)',
    'function withdraw(uint256 receiptAmount)',
    'function borrow(uint256 amount)',
    'function repay(uint256 amount)'
  ];
  /* Minimal ABI for the Shity Auction escrow (any token in, USDC escrowed). */
  var AUCTION_ESCROW_ABI = [
    'function createListing(uint256 priceUsdc) returns (uint256)',
    'function cancelListing(uint256 listingId)',
    'function buy(uint256 listingId, address tokenIn, uint256 amountIn, uint256 minUsdcOut) payable returns (uint256)',
    'function ship(uint256 orderId)',
    'function dispute(uint256 orderId)',
    'function cancelOrder(uint256 orderId)',
    'function listings(uint256) view returns (address seller, uint256 priceUsdc, bool active)',
    'function orders(uint256) view returns (address buyer, address seller, uint256 principal, uint256 supplied, uint256 liquidHeld, uint8 state)',
    'function feeBps() view returns (uint256)',
    'function nextListingId() view returns (uint256)',
    'event Bought(uint256 indexed orderId, uint256 indexed listingId, address indexed buyer, uint256 principal)'
  ];

  // Shared DEX deployment on a chain, or null when not deployed yet.
  function dexDeployment(chainKey) {
    var d = (PRODUCTS.dex.deployments || {})[chainKey];
    return (d && d.factory && d.router) ? d : null;
  }

  // Swap fee percent string for a chain (e.g. '0.005%').
  function dexFee(chainKey) {
    return (PRODUCTS.dex.fees || {})[chainKey] || '0.3%';
  }

  // Shared lending factory on a chain, or null when not deployed yet.
  function lendingDeployment(chainKey) {
    var d = (PRODUCTS.lending.deployments || {})[chainKey];
    return (d && d.factory) ? d : null;
  }

  // Shared launchpad factories on a chain, or null when not deployed yet.
  function launchpadDeployment(chainKey) {
    var d = (PRODUCTS.launchpad.deployments || {})[chainKey];
    return (d && d.tokenFactory && d.saleFactory) ? d : null;
  }

  // Shared auction escrow on a chain, or null when not deployed yet.
  function auctionDeployment(chainKey) {
    var d = (PRODUCTS.auction.deployments || {})[chainKey];
    return (d && d.escrow) ? d : null;
  }

  /* ---------------- small UI helpers ---------------- */
  function el(id) { return document.getElementById(id); }

  function shortAddr(a) {
    if (!a || a.length < 12) return a || '';
    return a.slice(0, 6) + '…' + a.slice(-4);
  }

  function explorerAddr(chainKey, addr) {
    var c = CHAINS[chainKey];
    if (c && c.explorer) return c.explorer + '/address/' + addr;
    return null;
  }

  function status(id, msg, kind) {
    var n = typeof id === 'string' ? el(id) : id;
    if (!n) return;
    n.className = 'deploy-status ' + (kind || '');
    n.innerHTML = msg;
    n.style.display = 'block';
  }

  function hideStatus(id) {
    var n = typeof id === 'string' ? el(id) : id;
    if (n) n.style.display = 'none';
  }

  function fmtErr(e) {
    if (!e) return 'unknown error';
    if (e.code === 4001) return 'You rejected the signature in your wallet. Nothing was sent.';
    if (e.code === -32603 && /insufficient funds/i.test(e.message || ''))
      return 'Insufficient funds for gas (and any creation fee).';
    var m = (e.reason || e.message || String(e)).slice(0, 220);
    return 'Failed: ' + m;
  }

  /* ---------------- EVM wallet (any EIP-1193 / EIP-6963 wallet) ---------------- */
  function hasEvmWallet() {
    return typeof window.ethereum !== 'undefined';
  }

  function evmProvider(external) {
    var eth = external || (typeof window.ethereum !== 'undefined' ? window.ethereum : null);
    if (!eth) throw new Error('No EVM wallet found. Install a wallet such as MetaMask, Coinbase Wallet, or Rabby, then reload.');
    if (typeof ethers === 'undefined')
      throw new Error('Network library failed to load. Check your connection and reload.');
    return new ethers.providers.Web3Provider(eth, 'any');
  }

  async function evmConnect(external) {
    var provider = evmProvider(external);
    await provider.send('eth_requestAccounts', []);
    return provider.getSigner();
  }

  function chainHex(chainId) {
    return '0x' + chainId.toString(16);
  }

  // Switch the wallet to the target chain, adding it first if unknown.
  async function ensureChain(chainKey, external) {
    var c = CHAINS[chainKey];
    if (!c) throw new Error('Unknown chain: ' + chainKey);
    var eth = external || (typeof window.ethereum !== 'undefined' ? window.ethereum : null);
    if (!eth) {
      try { if (window.phantom && window.phantom.ethereum) eth = window.phantom.ethereum; } catch (e) {}
    }
    // Unwrap an ethers provider back to the raw EIP-1193 handle when needed.
    if (eth && typeof eth.request !== 'function' && eth.provider && typeof eth.provider.request === 'function')
      eth = eth.provider;
    var provider = evmProvider(eth);
    var net = await provider.getNetwork();
    if (net.chainId === c.chainId) return provider;
    var targetHex = chainHex(c.chainId);
    async function doSwitch() {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }]
      });
    }
    try {
      await doSwitch();
    } catch (e) {
      if (e.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetHex,
            chainName: c.label,
            nativeCurrency: c.currency,
            rpcUrls: [c.rpc],
            blockExplorerUrls: c.explorer ? [c.explorer] : []
          }]
        });
      } else {
        throw e;
      }
    }
    // Some wallets stay on the old chain after adding — verify and switch again.
    var cur = await eth.request({ method: 'eth_chainId' });
    if (parseInt(cur, 16) !== c.chainId) await doSwitch();
    return evmProvider(eth);
  }

  // EIP-6963 multi-wallet discovery. Returns [{info:{name,icon,uuid}, provider}].
  function discoverEvmWallets(timeoutMs) {
    return new Promise(function (resolve) {
      var found = [];
      function onAnnounce(ev) {
        var d = (ev && ev.detail) || {};
        if (!d.info || !d.provider) return;
        for (var i = 0; i < found.length; i++) {
          if (found[i].info.uuid === d.info.uuid) return;
        }
        found.push({ info: d.info, provider: d.provider });
      }
      try {
        window.addEventListener('eip6963:announceProvider', onAnnounce);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
      } catch (e) { /* older browsers: fall through to legacy check */ }
      setTimeout(function () {
        try { window.removeEventListener('eip6963:announceProvider', onAnnounce); } catch (e) {}
        // Direct injections (some wallets, e.g. Phantom's EVM provider at
        // window.phantom.ethereum, do not always announce via EIP-6963).
        function addDirect(info, provider) {
          if (!provider) return;
          for (var i = 0; i < found.length; i++) {
            if (found[i].provider === provider) return;
          }
          found.push({ info: info, provider: provider });
        }
        if (typeof window.ethereum !== 'undefined') {
          var eth = window.ethereum;
          // window.ethereum may be a shim over several injected providers.
          var list = (eth.providers && eth.providers.length) ? eth.providers : [eth];
          for (var j = 0; j < list.length; j++) {
            var p = list[j];
            var nm = p.isPhantom ? 'Phantom'
              : (p.isMetaMask ? 'MetaMask'
              : (p.isCoinbaseWallet ? 'Coinbase Wallet'
              : (p.isRabby ? 'Rabby' : 'Browser wallet')));
            addDirect({ name: nm, uuid: 'injected-' + j, icon: '' }, p);
          }
        }
        try {
          if (window.phantom && window.phantom.ethereum)
            addDirect({ name: 'Phantom', uuid: 'phantom-evm', icon: '' }, window.phantom.ethereum);
        } catch (e) {}
        resolve(found);
      }, timeoutMs || 400);
    });
  }

  var _pickerCssDone = false;
  function evmPickerCss() {
    if (_pickerCssDone) return;
    _pickerCssDone = true;
    var st = document.createElement('style');
    st.textContent =
      '.shity-wal{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}' +
      '.shity-wal-box{background:#141418;border:1px solid #2a2a30;border-radius:16px;padding:22px;width:320px;max-width:100%}' +
      '.shity-wal-box h3{margin:0 0 14px;color:#f2f0eb;font-size:17px}' +
      '.shity-wal-opt{display:flex;align-items:center;gap:12px;width:100%;background:#1a1a1e;border:1px solid #3a3a42;color:#f2f0eb;border-radius:12px;padding:12px 14px;margin:0 0 10px;font-size:15px;cursor:pointer;text-align:left;font-family:inherit}' +
      '.shity-wal-opt:hover{border-color:#F5820B}' +
      '.shity-wal-opt img{width:28px;height:28px;border-radius:8px}' +
      '.shity-wal-cancel{width:100%;background:transparent;border:none;color:#8a8a94;font-size:14px;cursor:pointer;padding:6px;font-family:inherit}';
    document.head.appendChild(st);
  }

  // Choice dialog when several wallets are installed.
  // Resolves with the chosen {info, provider}; rejects on cancel.
  function pickEvmWallet(wallets) {
    return new Promise(function (resolve, reject) {
      evmPickerCss();
      var ov = document.createElement('div');
      ov.className = 'shity-wal';
      var box = document.createElement('div');
      box.className = 'shity-wal-box';
      var h = document.createElement('h3');
      h.textContent = 'Choose a wallet';
      box.appendChild(h);
      function done(val, err) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        document.removeEventListener('keydown', onKey);
        if (err) reject(err); else resolve(val);
      }
      function onKey(e) { if (e.key === 'Escape') done(null, new Error('Wallet selection cancelled.')); }
      document.addEventListener('keydown', onKey);
      ov.addEventListener('click', function (e) {
        if (e.target === ov) done(null, new Error('Wallet selection cancelled.'));
      });
      wallets.forEach(function (w) {
        var b = document.createElement('button');
        b.className = 'shity-wal-opt';
        b.type = 'button';
        if (w.info.icon) {
          var im = document.createElement('img');
          im.src = w.info.icon;
          im.alt = '';
          b.appendChild(im);
        }
        var sp = document.createElement('span');
        sp.textContent = w.info.name || 'Wallet';
        b.appendChild(sp);
        b.addEventListener('click', function () { done(w, null); });
        box.appendChild(b);
      });
      var c = document.createElement('button');
      c.className = 'shity-wal-cancel';
      c.type = 'button';
      c.textContent = 'Cancel';
      c.addEventListener('click', function () { done(null, new Error('Wallet selection cancelled.')); });
      box.appendChild(c);
      ov.appendChild(box);
      document.body.appendChild(ov);
    });
  }

  // Connect any EVM wallet: EIP-6963 discovery, picker when several are
  // installed, account request, then switch/add the target chain.
  // Resolves {provider, signer, address, walletName}.
  // Mobile (no injected provider): deep links that open this page inside a
  // wallet app's built-in browser, where EVM injection works. The promise
  // never resolves on this tab; the user continues in the wallet app.
  function pickMobileEvmWallet() {
    return new Promise(function (resolve, reject) {
      evmPickerCss();
      var pageUrl = location.origin + location.pathname;
      var links = [
        { name: 'Phantom',
          url: 'https://phantom.app/ul/browse/' + encodeURIComponent(pageUrl) +
               '?ref=' + encodeURIComponent(location.origin) },
        { name: 'MetaMask',
          url: 'https://metamask.app.link/dapp/' + location.host + location.pathname },
        { name: 'Coinbase Wallet',
          url: 'https://go.cb-w.com/dapp?cb_url=' + encodeURIComponent(pageUrl) }
      ];
      var ov = document.createElement('div');
      ov.className = 'shity-wal';
      var box = document.createElement('div');
      box.className = 'shity-wal-box';
      var h = document.createElement('h3');
      h.textContent = 'Open in a wallet app';
      box.appendChild(h);
      var note = document.createElement('p');
      note.textContent = 'Mobile browsers can\u2019t reach wallets directly. Pick a wallet to continue there \u2014 this page will open inside its browser.';
      note.style.cssText = 'color:#8a8a94;font-size:13px;margin:0 0 14px;line-height:1.45';
      box.appendChild(note);
      function done(err) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        document.removeEventListener('keydown', onKey);
        if (err) reject(err);
      }
      function onKey(e) { if (e.key === 'Escape') done(new Error('Wallet selection cancelled.')); }
      document.addEventListener('keydown', onKey);
      ov.addEventListener('click', function (e) {
        if (e.target === ov) done(new Error('Wallet selection cancelled.'));
      });
      links.forEach(function (l) {
        var a = document.createElement('a');
        a.className = 'shity-wal-opt';
        a.href = l.url;
        a.textContent = l.name;
        a.style.textDecoration = 'none';
        box.appendChild(a);
      });
      var cancel = document.createElement('button');
      cancel.className = 'shity-wal-cancel';
      cancel.type = 'button';
      cancel.textContent = 'Cancel';
      cancel.addEventListener('click', function () { done(new Error('Wallet selection cancelled.')); });
      box.appendChild(cancel);
      ov.appendChild(box);
      document.body.appendChild(ov);
    });
  }

  async function connectEvmWallet(chainKey) {
    var wallets = await discoverEvmWallets(400);
    if (!wallets.length) {
      if (isMobileBrowser()) return pickMobileEvmWallet();
      throw new Error('No EVM wallet found. Install a wallet such as MetaMask, Coinbase Wallet, Rabby, or Phantom, then reload.');
    }
    var chosen = wallets.length === 1 ? wallets[0] : await pickEvmWallet(wallets);
    var provider = await ensureChain(chainKey, chosen.provider);
    await provider.send('eth_requestAccounts', []);
    var signer = provider.getSigner();
    var address = await signer.getAddress();
    return { provider: provider, signer: signer, address: address,
             walletName: chosen.info.name || 'wallet',
             rawProvider: chosen.provider };
  }

  // Fetch the per-chain deploy bundle: /assets/deploys/<product>/<chain>.json
  // -> { product, chain, chainId, contracts: { Name: { abi, bytecode } } }.
  async function loadArtifact(product, chain) {
    var res = await fetch('/assets/deploys/' + product + '/' + chain + '.json');
    if (!res.ok) throw new Error('Could not load the contract bundle for ' + product + ' on ' + chain + '.');
    return res.json();
  }

  // Deploy an EVM contract with ethers v5 (window.ethers UMD build).
  // signer: ethers signer already switched to the right chain.
  // contract: { abi, bytecode } entry from loadArtifact().
  // Returns { address, txHash }.
  async function deployContract(signer, contract, args, valueWei) {
    var ethers = window.ethers;
    if (!ethers || !ethers.ContractFactory) throw new Error('ethers.js failed to load. Reload the page and try again.');
    var factory = new ethers.ContractFactory(contract.abi, contract.bytecode, signer);
    var overrides = {};
    if (valueWei) overrides.value = valueWei;
    var c = await factory.deploy.apply(factory, (args || []).concat([overrides]));
    await c.deployTransaction.wait();
    return { address: c.address, txHash: c.deployTransaction.hash };
  }

  /* ---------------- Solana ---------------- */
  var SOL_RPC = 'https://api.mainnet-beta.solana.com';

  function hasPhantom() {
    return typeof window.solana !== 'undefined' && window.solana.isPhantom;
  }

  async function phantomConnect() {
    if (hasPhantom()) {
      var r = await window.solana.connect();
      return r.publicKey.toString();
    }
    // No injected provider (e.g. iOS Safari): deep-link into the Phantom
    // app. It redirects back and the session is restored on load.
    if (isMobileBrowser()) return phantomConnectMobile();
    throw new Error('Phantom not found. Install the Phantom wallet.');
  }

  /* ----- Phantom on mobile browsers: deep-link connect (no injection) ----- */
  // Mobile Safari cannot have wallet extensions, so window.solana never
  // exists there. Phantom's universal-link flow connects without injection:
  // we redirect to phantom.app/ul/v1/connect, the user approves in the
  // Phantom app, and Phantom redirects back with a NaCl-encrypted payload
  // we decrypt with tweetnacl (loaded from CDN before this file).

  var B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function b58encode(bytes) {
    var n = 0;
    while (n < bytes.length && bytes[n] === 0) n++;
    var digits = [0];
    for (var i = n; i < bytes.length; i++) {
      var carry = bytes[i];
      for (var j = 0; j < digits.length; j++) {
        carry += digits[j] * 256;
        digits[j] = carry % 58;
        carry = Math.floor(carry / 58);
      }
      while (carry > 0) { digits.push(carry % 58); carry = Math.floor(carry / 58); }
    }
    var str = '';
    for (var l = 0; l < n; l++) str += '1';
    for (var k = digits.length - 1; k >= 0; k--) str += B58_ALPHABET.charAt(digits[k]);
    return str;
  }

  function b58decode(str) {
    var n = 0;
    while (n < str.length && str.charAt(n) === '1') n++;
    var digits = [];
    for (var i = n; i < str.length; i++) {
      var c = B58_ALPHABET.indexOf(str.charAt(i));
      if (c === -1) throw new Error('Invalid base58 character');
      var carry = c;
      for (var j = 0; j < digits.length; j++) {
        carry += digits[j] * 58;
        digits[j] = carry & 255;
        carry = Math.floor(carry / 256);
      }
      while (carry > 0) { digits.push(carry & 255); carry = Math.floor(carry / 256); }
    }
    var out = new Uint8Array(n + digits.length);
    for (var k = 0; k < digits.length; k++) out[out.length - 1 - k] = digits[k];
    return out;
  }

  function isMobileBrowser() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
  }

  var PHANTOM_SESSION_KEY = 'shity_phantom_session';
  var PHANTOM_SECRET_KEY = 'shity_phantom_dapp_secret';
  var PHANTOM_RETURN_KEY = 'shity_phantom_return';
  var PHANTOM_ERROR_KEY = 'shity_phantom_error';

  function getPhantomSession() {
    try {
      var raw = sessionStorage.getItem(PHANTOM_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function phantomSessionAddress() {
    var s = getPhantomSession();
    return s && s.publicKey ? s.publicKey : null;
  }

  function utf8decode(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return decodeURIComponent(escape(s));
  }

  // Runs at load: if we just came back from the Phantom app, finish the
  // handshake and stash { publicKey, session }. Never throws.
  function phantomHandleRedirect() {
    var m = /[?&]phantom_encryption_public_key=([^&]+)/.exec(location.search || '');
    if (!m) {
      // A rejection comes back as ?errorCode=&errorMessage= — stash it so
      // the page can tell the user, and clean the URL.
      try {
        var em = /[?&]errorCode=([^&]*)/.exec(location.search || '');
        if (em) {
          var emsg = /[?&]errorMessage=([^&]*)/.exec(location.search || '');
          sessionStorage.setItem(PHANTOM_ERROR_KEY,
            emsg ? decodeURIComponent(emsg[1].replace(/\+/g, ' ')) : 'declined');
          history.replaceState(null, '', location.pathname + location.hash);
        }
      } catch (e) {}
      return false;
    }
    try {
      if (typeof nacl === 'undefined' || !nacl.box || !nacl.box.before) return false;
      var q = {};
      (location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
        var i = kv.indexOf('=');
        if (i > 0) q[kv.slice(0, i)] = kv.slice(i + 1);
      });
      if (!q.nonce || !q.data) return false;
      var secretB58 = sessionStorage.getItem(PHANTOM_SECRET_KEY);
      if (!secretB58) return false;
      var dappKeys = nacl.box.keyPair.fromSecretKey(b58decode(secretB58));
      var shared = nacl.box.before(b58decode(q.phantom_encryption_public_key), dappKeys.secretKey);
      var pt = nacl.box.open.after(b58decode(q.data), b58decode(q.nonce), shared);
      if (!pt) return false;
      var info = JSON.parse(utf8decode(pt));
      if (!info.public_key) return false;
      sessionStorage.setItem(PHANTOM_SESSION_KEY,
        JSON.stringify({ publicKey: info.public_key, session: info.session || '' }));
      sessionStorage.removeItem(PHANTOM_SECRET_KEY);
      sessionStorage.setItem(PHANTOM_RETURN_KEY, '1');
      history.replaceState(null, '', location.pathname + location.hash);
      return true;
    } catch (e) { return false; }
  }

  function phantomConnectMobile() {
    if (typeof nacl === 'undefined' || !nacl.box || !nacl.box.keyPair)
      throw new Error('Crypto library failed to load. Check your connection, reload, and try again.');
    var kp = nacl.box.keyPair();
    try { sessionStorage.setItem(PHANTOM_SECRET_KEY, b58encode(kp.secretKey)); } catch (e) {}
    var redirect = location.origin + location.pathname + '?ph=1';
    location.href = 'https://phantom.app/ul/v1/connect' +
      '?app_url=' + encodeURIComponent(location.origin) +
      '&dapp_encryption_public_key=' + b58encode(kp.publicKey) +
      '&redirect_link=' + encodeURIComponent(redirect) +
      '&cluster=mainnet-beta';
    return new Promise(function () {}); // page unloads on redirect; never resolves
  }

  // Returns true if a program is deployed at the address on mainnet.
  async function solanaProgramLive(programId) {
    var res = await fetch(SOL_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getAccountInfo',
        params: [programId, { encoding: 'base64', commitment: 'confirmed' }]
      })
    });
    if (!res.ok) throw new Error('Solana RPC unreachable (HTTP ' + res.status + ').');
    var j = await res.json();
    return !!(j.result && j.result.value);
  }

  function solanaDeployCmd(soFile, keypairHint) {
    return 'solana program deploy ' + soFile +
      ' --program-id ' + keypairHint +
      ' --url https://api.mainnet-beta.solana.com';
  }

  /* ---------------- public API ---------------- */
  global.SHITY = {
    CHAINS: CHAINS,
    PRODUCTS: PRODUCTS,
    FEE_EVM: FEE_EVM,
    FEE_SOL: FEE_SOL,
    FEE_TON: FEE_TON,
    SOL_RPC: SOL_RPC,
    el: el,
    shortAddr: shortAddr,
    explorerAddr: explorerAddr,
    status: status,
    hideStatus: hideStatus,
    fmtErr: fmtErr,
    hasEvmWallet: hasEvmWallet,
    evmConnect: evmConnect,
    ensureChain: ensureChain,
    discoverEvmWallets: discoverEvmWallets,
    pickEvmWallet: pickEvmWallet,
    connectEvmWallet: connectEvmWallet,
    loadArtifact: loadArtifact,
    deployContract: deployContract,
    dexDeployment: dexDeployment,
    dexFee: dexFee,
    lendingDeployment: lendingDeployment,
    launchpadDeployment: launchpadDeployment,
    auctionDeployment: auctionDeployment,
    ERC20_ABI: ERC20_ABI,
    PAIR_ABI: PAIR_ABI,
    POOL_ABI: POOL_ABI,
    AUCTION_ESCROW_ABI: AUCTION_ESCROW_ABI,
    hasPhantom: hasPhantom,
    phantomConnect: phantomConnect,
    phantomSessionAddress: phantomSessionAddress,
    solanaProgramLive: solanaProgramLive,
    solanaDeployCmd: solanaDeployCmd
  };
})(window);
