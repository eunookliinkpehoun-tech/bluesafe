"""End-to-end local test of the Tirelire contracts on an in-memory EVM (py-evm).

Usage: python test_local.py
"""
import json
import time
from pathlib import Path

from eth_account import Account
from eth_account.messages import encode_typed_data
from web3 import Web3
from web3.providers.eth_tester import EthereumTesterProvider

OUT = Path(__file__).parent / "out"
E18 = 10**18


def art(name):
    return json.loads((OUT / f"{name}.json").read_text())


w3 = Web3(EthereumTesterProvider())
admin = w3.eth.accounts[0]
w3.eth.default_account = admin
chain_id = w3.eth.chain_id


def deploy(name, *args):
    a = art(name)
    c = w3.eth.contract(abi=a["abi"], bytecode=a["bytecode"])
    tx = c.constructor(*args).transact()
    r = w3.eth.wait_for_transaction_receipt(tx)
    print(f"deployed {name} gas={r.gasUsed}")
    return w3.eth.contract(address=r.contractAddress, abi=a["abi"])


usdt = deploy("MockUSDT")
impl = deploy("TirelireVault")
factory = deploy("TirelireFactory", usdt.address, impl.address, 50 * E18, 6000)
VAULT_ABI = art("TirelireVault")["abi"]


def vault_at(addr):
    return w3.eth.contract(address=addr, abi=VAULT_ABI)


def sign_activate(acct, name, code, referrer, deadline):
    msg = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "Activate": [
                {"name": "owner", "type": "address"},
                {"name": "name", "type": "string"},
                {"name": "code", "type": "bytes32"},
                {"name": "referrer", "type": "address"},
                {"name": "deadline", "type": "uint256"},
            ],
        },
        "primaryType": "Activate",
        "domain": {"name": "TirelireFactory", "version": "1", "chainId": chain_id, "verifyingContract": factory.address},
        "message": {"owner": acct.address, "name": name, "code": code, "referrer": referrer, "deadline": deadline},
    }
    return Account.sign_message(encode_typed_data(full_message=msg), acct.key).signature


def sign_execute(acct, vault, data, nonce, deadline):
    msg = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "Execute": [
                {"name": "data", "type": "bytes"},
                {"name": "nonce", "type": "uint256"},
                {"name": "deadline", "type": "uint256"},
            ],
        },
        "primaryType": "Execute",
        "domain": {"name": "TirelireVault", "version": "1", "chainId": chain_id, "verifyingContract": vault.address},
        "message": {"data": data, "nonce": nonce, "deadline": deadline},
    }
    return Account.sign_message(encode_typed_data(full_message=msg), acct.key).signature


def code32(s):
    return s.encode().ljust(32, b"\0")


def meta(acct, vault, fn_name, *args):
    data = vault.encode_abi(fn_name, args=list(args))
    nonce = vault.functions.nonce().call()
    deadline = int(time.time()) + 3600
    sig = sign_execute(acct, vault, bytes.fromhex(data[2:]), nonce, deadline)
    tx = vault.functions.executeMeta(data, deadline, sig).transact({"from": admin})
    r = w3.eth.wait_for_transaction_receipt(tx)
    assert r.status == 1, fn_name
    print(f"  meta {fn_name} gas={r.gasUsed}")
    return r


alice = Account.create()
bob = Account.create()
deadline = int(time.time()) + 3600

# --- Alice: deposits 60 USDT to her predicted address, then gasless activation
a_pred = factory.functions.predictVault(alice.address).call()
usdt.functions.mint(a_pred, 60 * E18).transact()
sig = sign_activate(alice, "Alice", code32("ALICE-1234"), "0x" + "0" * 40, deadline)
r = w3.eth.wait_for_transaction_receipt(
    factory.functions.activateFor(alice.address, "Alice", code32("ALICE-1234"), "0x" + "0" * 40, deadline, sig).transact()
)
print("alice activation gas", r.gasUsed)
a_vault = vault_at(factory.functions.vaultOf(alice.address).call())
assert a_vault.address == a_pred
s = a_vault.functions.summary().call()
print("alice summary", s)
assert s[2] == 10 * E18 and s[3] == 10 * E18
assert factory.functions.held().call() == 50 * E18

# Bad signature must fail
try:
    bad = sign_activate(bob, "Bob", code32("BOB-0001"), alice.address, deadline)
    factory.functions.activateFor(bob.address, "Mallory", code32("BOB-0001"), alice.address, deadline, bad).transact()
    raise SystemExit("bad sig accepted!")
except Exception as e:
    print("bad sig rejected ok:", str(e)[:60])

# --- Bob: referred by Alice
b_pred = factory.functions.predictVault(bob.address).call()
usdt.functions.mint(b_pred, 100 * E18).transact()
sig = sign_activate(bob, "Bob", code32("BOB-0001"), alice.address, deadline)
r = w3.eth.wait_for_transaction_receipt(
    factory.functions.activateFor(bob.address, "Bob", code32("BOB-0001"), alice.address, deadline, sig).transact()
)
print("bob activation (with referral) gas", r.gasUsed)
b_vault = vault_at(b_pred)
assert usdt.functions.balanceOf(a_vault.address).call() == 40 * E18
assert factory.functions.totalEarned(alice.address).call() == 30 * E18
print("alice entries", a_vault.functions.getEntries(0, 10).call())
print("alice referrals", factory.functions.getReferrals(alice.address, 0, 10).call())

# --- Bob gasless ops
meta(bob, b_vault, "createSub", "Wedding", 1, 1000 * E18, 0)
meta(bob, b_vault, "allocate", 0, 20 * E18)
meta(bob, b_vault, "release", 0, 5 * E18)
meta(bob, b_vault, "createSub", "Locked", 0, 0, int(time.time()) + 86400 * 30)
meta(bob, b_vault, "allocate", 1, 10 * E18)
try:
    meta(bob, b_vault, "release", 1, 1 * E18)
    raise SystemExit("locked release accepted!")
except AssertionError:
    raise
except Exception as e:
    print("locked release rejected ok:", str(e)[:60])
meta(bob, b_vault, "transfer", a_vault.address, 7 * E18)
meta(bob, b_vault, "withdraw", bob.address, 3 * E18)
try:
    meta(bob, b_vault, "withdraw", bob.address, 1000 * E18)
    raise SystemExit("overdraft accepted!")
except AssertionError:
    raise
except Exception as e:
    print("overdraft rejected ok:", str(e)[:60])

# plain deposit + relayer sync with hint
usdt.functions.mint(b_vault.address, 2 * E18).transact()
w3.eth.wait_for_transaction_receipt(b_vault.functions.sync(alice.address).transact({"from": admin}))

# replay must fail (nonce)
try:
    data = b_vault.encode_abi("withdraw", args=[bob.address, E18])
    old = sign_execute(bob, b_vault, bytes.fromhex(data[2:]), 0, deadline)
    b_vault.functions.executeMeta(data, deadline, old).transact()
    raise SystemExit("replay accepted!")
except SystemExit:
    raise
except Exception as e:
    print("replay rejected ok:", str(e)[:60])

# Direct call by stranger must fail
try:
    b_vault.functions.withdraw(admin, E18).transact({"from": w3.eth.accounts[2]})
    raise SystemExit("stranger withdraw accepted!")
except SystemExit:
    raise
except Exception as e:
    print("stranger rejected ok:", str(e)[:60])

sb = b_vault.functions.summary().call()
print("bob summary", sb)
# 100 - 50 activation - 7 - 3 + 2 = 42
assert sb[2] == 42 * E18 and sb[3] == 42 * E18 and sb[4] == 25 * E18
print("bob subs", b_vault.functions.getSubs().call())
for e in b_vault.functions.getEntries(0, 20).call():
    print("  bob entry", e)
sa = a_vault.functions.summary().call()
assert sa[2] == 47 * E18 and sa[3] == 47 * E18
print("alice entries", a_vault.functions.getEntries(0, 10).call())

# Admin: treasury + sweep
treasury = w3.eth.accounts[3]
factory.functions.setTreasury(treasury).transact()
factory.functions.sweep().transact()
assert usdt.functions.balanceOf(treasury).call() == 70 * E18
print("ALL TESTS PASSED")
