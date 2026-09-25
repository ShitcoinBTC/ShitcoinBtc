#!/usr/bin/env python3
"""
Shitcoin web wallet API.

Read-only chain access + transaction broadcast for the shitcoinbtc.xyz
web wallet. PRIVATE KEYS AND MNEMONICS NEVER TOUCH THIS SERVER —
all signing happens client-side in the user's browser.

Endpoints:
- GET  /api/wallet/utxos/<address>  -> {address, balance_shit, utxos: [...]}
- POST /api/wallet/broadcast        -> {txid}   (body: {"hex": "<signed tx hex>"})
"""
from flask import Flask, request, jsonify
import subprocess
import json
import re
import threading

app = Flask(__name__)

CLI = ['/usr/local/bin/syscoin-cli', '-datadir=/home/shitcoin/.syscoin']
SCAN_LOCK = threading.Lock()

# bech32 P2WPKH shit1q... addresses only
ADDR_RE = re.compile(r'^shit1q[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$')
HEX_RE = re.compile(r'^[0-9a-fA-F]+$')
MAX_TX_HEX_LEN = 200000  # 100 kB, far above any wallet tx


def rpc(*args, timeout=300):
    p = subprocess.run(CLI + list(args), capture_output=True, text=True, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or 'node RPC error')
    out = p.stdout.strip()
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return out


@app.route('/api/wallet/utxos/<address>', methods=['GET'])
def utxos(address):
    address = address.strip().lower()
    if not ADDR_RE.match(address):
        return jsonify({'error': 'Invalid shit1 address'}), 400
    try:
        with SCAN_LOCK:
            res = rpc('scantxoutset', 'start', json.dumps(['addr(%s)' % address]))
    except RuntimeError as e:
        return jsonify({'error': 'Node error: %s' % str(e)[:200]}), 502
    except Exception as e:
        return jsonify({'error': 'Scan failed'}), 500
    utxo_list = []
    for u in res.get('unspents', []):
        utxo_list.append({
            'txid': u['txid'],
            'vout': u['vout'],
            'amount': u['amount'],
            'scriptPubKey': u['scriptPubKey'],
            'height': u.get('height', 0),
        })
    return jsonify({
        'address': address,
        'balance_shit': res.get('total_amount', 0),
        'height': res.get('height', 0),
        'utxos': utxo_list,
    })


@app.route('/api/wallet/broadcast', methods=['POST'])
def broadcast():
    data = request.get_json(force=True, silent=True) or {}
    hex_tx = data.get('hex', '')
    if not isinstance(hex_tx, str) or not HEX_RE.match(hex_tx):
        return jsonify({'error': 'Invalid transaction hex'}), 400
    if len(hex_tx) % 2 != 0 or len(hex_tx) > MAX_TX_HEX_LEN or len(hex_tx) < 20:
        return jsonify({'error': 'Invalid transaction hex'}), 400
    try:
        txid = rpc('sendrawtransaction', hex_tx.lower(), timeout=120)
    except RuntimeError as e:
        msg = str(e)[:300]
        return jsonify({'error': 'Broadcast rejected: %s' % msg}), 400
    return jsonify({'txid': txid})


@app.route('/api/wallet/health', methods=['GET'])
def health():
    return jsonify({'ok': True})


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5003)
