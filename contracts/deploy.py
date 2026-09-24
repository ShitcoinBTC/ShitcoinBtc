#!/usr/bin/env python3
"""Deploy the Shitcoin NEVM contracts (ShitSwapFactory, ShitLottery, ShitVault).

Usage:
    pip install web3
    export RPC_URL="https://nevm-rpc.shitcoin.example"   # your Shitcoin NEVM RPC
    export PRIVATE_KEY="0x..."                            # deployer key (NEVER commit this)
    python3 deploy.py [--ticket-price 100] [--round-blocks 576]

Writes deployed addresses to deployments.json next to this script.
"""
import argparse
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build"


def load_artifact(name):
    path = BUILD / f"{name}.json"
    if not path.exists():
        sys.exit(f"missing build artifact: {path} (run the compile step first)")
    return json.loads(path.read_text())


def deploy(w3, account, name, *args):
    art = load_artifact(name)
    contract = w3.eth.contract(abi=art["abi"], bytecode=art["bytecode"])
    tx = contract.constructor(*args).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gasPrice": w3.eth.gas_price,
    })
    tx["gas"] = w3.eth.estimate_gas(tx)
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status != 1:
        sys.exit(f"deployment of {name} failed: {tx_hash.hex()}")
    print(f"{name} -> {receipt.contractAddress}  (tx {tx_hash.hex()})")
    return receipt.contractAddress


def main():
    parser = argparse.ArgumentParser(description="Deploy Shitcoin NEVM contracts")
    parser.add_argument("--ticket-price", type=float, default=100.0,
                        help="ShitLottery ticket price in SHIT (default: 100)")
    parser.add_argument("--round-blocks", type=int, default=576,
                        help="ShitLottery round length in blocks, ~1 day at 150s/block (default: 576)")
    args = parser.parse_args()

    try:
        from web3 import Web3
    except ImportError:
        sys.exit("web3 is not installed: pip install web3")

    rpc_url = os.environ.get("RPC_URL")
    private_key = os.environ.get("PRIVATE_KEY")
    if not rpc_url or not private_key:
        sys.exit("set RPC_URL and PRIVATE_KEY environment variables first")

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        sys.exit(f"could not connect to RPC at {rpc_url}")
    print(f"connected to chain id {w3.eth.chain_id}")

    account = w3.eth.account.from_key(private_key)
    balance = w3.eth.get_balance(account.address)
    print(f"deployer {account.address} balance: {w3.from_wei(balance, 'ether')} SHIT")
    if balance == 0:
        sys.exit("deployer has no funds for gas")

    deployments = {}
    deployments["ShitSwapFactory"] = deploy(w3, account, "ShitSwapFactory")
    deployments["ShitLottery"] = deploy(
        w3, account, "ShitLottery",
        w3.to_wei(args.ticket_price, "ether"), args.round_blocks)
    deployments["ShitVault"] = deploy(w3, account, "ShitVault")

    out = HERE / "deployments.json"
    out.write_text(json.dumps(
        {"chainId": w3.eth.chain_id, "contracts": deployments}, indent=2))
    print(f"saved -> {out}")


if __name__ == "__main__":
    main()
