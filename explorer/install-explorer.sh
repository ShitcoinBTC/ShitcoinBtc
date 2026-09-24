#!/usr/bin/env bash
#
# Install BTC RPC Explorer for ShitcoinBtc on the launch VPS.
#
# Run from this repo's explorer/ directory:
#   sudo NODE_USER=shitcoin ./install-explorer.sh
#
# NODE_USER must be the OS user that runs syscoind (cookie auth).
# Set EXPLORER_VERSION to move to a newer upstream release.
#
set -euo pipefail

EXPLORER_VERSION="${EXPLORER_VERSION:-v3.5.0}"   # pinned; verified 2026-09-24 — re-check latest before launch
NODE_USER="${NODE_USER:-shitcoin}"
INSTALL_DIR="/opt/shitcoin-explorer"
UPSTREAM="https://github.com/janoside/btc-rpc-explorer.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run as root (sudo)." >&2
  exit 1
fi

if ! id "$NODE_USER" >/dev/null 2>&1; then
  echo "ERROR: user '$NODE_USER' does not exist. Create it (it should be the syscoind user)," >&2
  echo "or set NODE_USER to the user that runs syscoind." >&2
  exit 1
fi

echo "==> Installing OS dependencies"
apt-get update -qq
# TO-VERIFY: assumes Debian/Ubuntu with apt. Adjust for other distros.
apt-get install -y -qq curl git build-essential libzmq3-dev > /dev/null
# libzmq3-dev: fallback if the npm 'zeromq' package has no prebuilt binary.

echo "==> Installing Node.js 22 LTS (upstream requires 18+, recommends 22+)"
if ! command -v node >/dev/null 2>&1; then
  # TO-VERIFY: NodeSource setup URL current at launch time.
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs > /dev/null
fi
NODE_MAJOR="$(node --version | sed 's/^v//' | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: node >= 18 required, found $(node --version)." >&2
  exit 1
fi
echo "    node $(node --version)"

echo "==> Verifying upstream tag ${EXPLORER_VERSION} exists (fail loudly if not)"
if ! git ls-remote --tags "$UPSTREAM" | grep -q "refs/tags/${EXPLORER_VERSION}$"; then
  echo "ERROR: tag ${EXPLORER_VERSION} not found upstream. Check https://github.com/janoside/btc-rpc-explorer/releases" >&2
  echo "and set EXPLORER_VERSION explicitly. Refusing to install an unverified version." >&2
  exit 1
fi

echo "==> Fetching btc-rpc-explorer ${EXPLORER_VERSION} -> ${INSTALL_DIR}"
if [ -d "${INSTALL_DIR}/.git" ]; then
  git -C "$INSTALL_DIR" fetch --tags -q
else
  git clone -q "$UPSTREAM" "$INSTALL_DIR"
fi
git -C "$INSTALL_DIR" checkout -q "tags/${EXPLORER_VERSION}"

echo "==> npm install (this takes a few minutes)"
# TO-VERIFY on VPS: the 'zeromq' dependency may compile natively; build-essential + libzmq3-dev cover it.
npm --prefix "$INSTALL_DIR" install --omit=dev --no-audit --no-fund

echo "==> Writing ${INSTALL_DIR}/.env for ShitcoinBtc"
COOKIE_PATH="/home/${NODE_USER}/.syscoin/.cookie"
sed "s|^BTCEXP_BITCOIND_COOKIE=.*|BTCEXP_BITCOIND_COOKIE=${COOKIE_PATH}|" \
  "${SCRIPT_DIR}/shitcoin-explorer.env" > "${INSTALL_DIR}/.env"
chmod 600 "${INSTALL_DIR}/.env"
chown -R "${NODE_USER}:${NODE_USER}" "$INSTALL_DIR"

echo "==> Installing systemd unit"
sed "s|__NODE_USER__|${NODE_USER}|g" \
  "${SCRIPT_DIR}/systemd/btc-rpc-explorer.service" > /etc/systemd/system/btc-rpc-explorer.service
systemctl daemon-reload
systemctl enable -q btc-rpc-explorer.service
systemctl restart btc-rpc-explorer.service

echo "==> Done. Status:"
systemctl --no-pager status btc-rpc-explorer.service | head -12
echo
echo "Explorer should be at http://127.0.0.1:3002/ (on the VPS)."
echo "Compare its height with:  sudo -u ${NODE_USER} syscoin-cli getblockcount"
echo "Logs: journalctl -u btc-rpc-explorer -f"
