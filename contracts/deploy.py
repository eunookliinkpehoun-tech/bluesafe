"""Deploy Tirelire contracts to BNB Smart Chain using the deployer key from backend/.env.

Usage: python deploy.py
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from eth_account import Account
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

ROOT = Path(__file__).parent
load_dotenv(ROOT.parent / "backend" / ".env")

RPC = os.environ["BSC_RPC_URLS"].split(",")[0]
CHAIN_ID = int(os.environ["CHAIN_ID"])
USDT = Web3.to_checksum_address(os.environ["USDT_ADDRESS"])
PRICE = 50 * 10**18
REFERRAL_BPS = 6000

w3 = Web3(Web3.HTTPProvider(RPC, request_kwargs={"timeout": 30}))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
acct = Account.from_key(os.environ["DEPLOYER_PRIVATE_KEY"])


def art(name):
    return json.loads((ROOT / "out" / f"{name}.json").read_text())


def send(tx):
    for k in ("maxFeePerGas", "maxPriorityFeePerGas", "type"):
        tx.pop(k, None)
    tx.update({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address, "pending"),
        "chainId": CHAIN_ID,
        "gasPrice": int(w3.eth.gas_price * 1.1),
    })
    tx["gas"] = int(w3.eth.estimate_gas(tx) * 1.15)
    signed = acct.sign_transaction(tx)
    h = w3.eth.send_raw_transaction(signed.raw_transaction)
    print("sent", h.hex())
    r = w3.eth.wait_for_transaction_receipt(h, timeout=180)
    assert r.status == 1, r
    print("  gasUsed", r.gasUsed, "contract", r.contractAddress)
    return r


def deploy(name, *args):
    a = art(name)
    c = w3.eth.contract(abi=a["abi"], bytecode=a["bytecode"])
    return send(c.constructor(*args).build_transaction({"from": acct.address})).contractAddress


if __name__ == "__main__":
    print("deployer", acct.address, "balance BNB", w3.eth.get_balance(acct.address) / 1e18)
    impl = deploy("TirelireVault")
    factory = deploy("TirelireFactory", USDT, impl, PRICE, REFERRAL_BPS)
    out = {"chainId": CHAIN_ID, "usdt": USDT, "implementation": impl, "factory": factory,
           "deployer": acct.address, "block": w3.eth.block_number}
    (ROOT / "deployments").mkdir(exist_ok=True)
    (ROOT / "deployments" / f"bsc-{CHAIN_ID}.json").write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))
    print("balance after", w3.eth.get_balance(acct.address) / 1e18)
