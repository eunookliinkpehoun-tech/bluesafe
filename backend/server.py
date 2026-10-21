"""Tirelire backend: stateless gasless relayer for the on-chain vaults.

No database. All balances, history, sub-accounts and referrals live in the
TirelireFactory / TirelireVault contracts on BNB Smart Chain. This service only:
  * exposes the public chain config,
  * relays owner-signed EIP-712 requests and pays the BNB gas (deployer wallet).
"""
import logging
import os
import re
import threading
import time
from collections import defaultdict, deque
from pathlib import Path
import json

from dotenv import load_dotenv
from eth_account import Account
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("tirelire")

CHAIN_ID = int(os.environ["CHAIN_ID"])
RPC_URLS = [u.strip() for u in os.environ["BSC_RPC_URLS"].split(",") if u.strip()]
LOGS_RPC_URL = os.environ["BSC_LOGS_RPC_URL"]
FACTORY_ADDRESS = Web3.to_checksum_address(os.environ["FACTORY_ADDRESS"])
USDT_ADDRESS = Web3.to_checksum_address(os.environ["USDT_ADDRESS"])
FACTORY_DEPLOY_BLOCK = int(os.environ["FACTORY_DEPLOY_BLOCK"])
EXPLORER_URL = os.environ["EXPLORER_URL"]
RELAYER = Account.from_key(os.environ["DEPLOYER_PRIVATE_KEY"])

VAULT_ABI = json.loads((ROOT_DIR / "abis" / "TirelireVault.json").read_text())["abi"]
FACTORY_ABI = json.loads((ROOT_DIR / "abis" / "TirelireFactory.json").read_text())["abi"]
ERC20_ABI = [{"type": "function", "name": "balanceOf", "stateMutability": "view",
              "inputs": [{"name": "a", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}]}]
TRANSFER_TOPIC = "0x" + Web3.keccak(text="Transfer(address,address,uint256)").hex().removeprefix("0x")

# Custom error selector -> name, used to return readable relay errors.
ERRORS = {}
for item in VAULT_ABI + FACTORY_ABI:
    if item.get("type") == "error":
        sig = f"{item['name']}({','.join(i['type'] for i in item['inputs'])})"
        ERRORS["0x" + Web3.keccak(text=sig).hex().removeprefix("0x")[:8]] = item["name"]


def _make_w3(url: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(url, request_kwargs={"timeout": 20}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return w3


W3S = [_make_w3(u) for u in RPC_URLS]
LOGS_W3 = _make_w3(LOGS_RPC_URL)


def w3() -> Web3:
    for candidate in W3S:
        try:
            candidate.eth.block_number
            return candidate
        except Exception as e:  # pragma: no cover - network dependent
            logger.warning("rpc down %s: %s", candidate.provider.endpoint_uri, e)
    raise HTTPException(503, "Blockchain RPC unavailable")


def factory(conn: Web3):
    return conn.eth.contract(address=FACTORY_ADDRESS, abi=FACTORY_ABI)


def vault(conn: Web3, address: str):
    return conn.eth.contract(address=Web3.to_checksum_address(address), abi=VAULT_ABI)


def usdt(conn: Web3):
    return conn.eth.contract(address=USDT_ADDRESS, abi=ERC20_ABI)


def decode_error(exc: Exception) -> str:
    text = str(exc)
    for sel, name in ERRORS.items():
        if sel in text.lower():
            return name
    m = re.search(r"execution reverted:?\s*([^'\"]*)", text)
    if m and m.group(1).strip():
        return m.group(1).strip()[:120]
    return "TransactionRejected"


# ------------------------------------------------------------- relayer core
_nonce_lock = threading.Lock()
_last_nonce = {"value": -1}
_rate = defaultdict(deque)
RATE_LIMIT = 30  # tx per window per key
RATE_WINDOW = 600  # seconds


def rate_limit(key: str):
    now = time.time()
    q = _rate[key.lower()]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        raise HTTPException(429, "Too many requests, please wait a few minutes")
    q.append(now)


def send_contract_tx(conn: Web3, fn) -> str:
    """Simulate then broadcast a contract call paid by the relayer wallet."""
    try:
        gas = fn.estimate_gas({"from": RELAYER.address})
    except Exception as e:
        reason = decode_error(e)
        logger.info("simulation reverted: %s", reason)
        raise HTTPException(400, reason)
    gas_price = int(conn.eth.gas_price * 1.1)
    with _nonce_lock:
        nonce = max(conn.eth.get_transaction_count(RELAYER.address, "pending"), _last_nonce["value"] + 1)
        tx = fn.build_transaction({
            "from": RELAYER.address,
            "nonce": nonce,
            "gas": int(gas * 1.25) + 20_000,
            "gasPrice": gas_price,
            "chainId": CHAIN_ID,
        })
        for k in ("maxFeePerGas", "maxPriorityFeePerGas", "type"):
            tx.pop(k, None)
        tx["gasPrice"] = gas_price
        signed = RELAYER.sign_transaction(tx)
        try:
            tx_hash = conn.eth.send_raw_transaction(signed.raw_transaction)
        except Exception as e:
            logger.exception("broadcast failed")
            raise HTTPException(502, f"Broadcast failed: {str(e)[:120]}")
        _last_nonce["value"] = nonce
    h = "0x" + tx_hash.hex().removeprefix("0x")
    logger.info("relayed tx %s", h)
    return h


# ------------------------------------------------------------------ models
HEX_ADDR = r"^0x[0-9a-fA-F]{40}$"
HEX_DATA = r"^0x[0-9a-fA-F]*$"


class ActivateRequest(BaseModel):
    owner: str = Field(pattern=HEX_ADDR)
    name: str = Field(min_length=1, max_length=32)
    code: str = Field(pattern=r"^0x[0-9a-fA-F]{64}$")
    referrer: str = Field(pattern=HEX_ADDR)
    deadline: int
    signature: str = Field(pattern=HEX_DATA)


class ExecuteRequest(BaseModel):
    vault: str = Field(pattern=HEX_ADDR)
    data: str = Field(pattern=HEX_DATA, max_length=4000)
    deadline: int
    signature: str = Field(pattern=HEX_DATA)


class SyncRequest(BaseModel):
    vault: str = Field(pattern=HEX_ADDR)


class TxResponse(BaseModel):
    txHash: str


# ------------------------------------------------------------------ routes
app = FastAPI(title="Tirelire Relayer")
api_router = APIRouter(prefix="/api")
_config_cache = {"at": 0.0, "value": None}


@api_router.get("/")
def root():
    return {"service": "tirelire-relayer", "chainId": CHAIN_ID}


@api_router.get("/config")
def get_config():
    now = time.time()
    if _config_cache["value"] and now - _config_cache["at"] < 60:
        return _config_cache["value"]
    conn = w3()
    price, referral_bps, treasury, held, vaults, admin = factory(conn).functions.info().call()
    value = {
        "chainId": CHAIN_ID,
        "rpcUrls": RPC_URLS,
        "factory": FACTORY_ADDRESS,
        "usdt": USDT_ADDRESS,
        "usdtDecimals": 18,
        "price": str(price),
        "referralBps": referral_bps,
        "totalVaults": vaults,
        "relayer": RELAYER.address,
        "explorer": EXPLORER_URL,
        "deployBlock": FACTORY_DEPLOY_BLOCK,
    }
    _config_cache.update(at=now, value=value)
    return value


@api_router.get("/relay/status")
def relayer_status():
    conn = w3()
    bal = conn.eth.get_balance(RELAYER.address)
    return {"relayer": RELAYER.address, "bnb": str(bal), "bnbFormatted": bal / 1e18,
            "gasPriceGwei": conn.eth.gas_price / 1e9}


@api_router.post("/relay/activate", response_model=TxResponse)
def relay_activate(req: ActivateRequest):
    if req.deadline < time.time():
        raise HTTPException(400, "Expired")
    rate_limit("activate:" + req.owner)
    conn = w3()
    f = factory(conn)
    owner = Web3.to_checksum_address(req.owner)
    if f.functions.vaultOf(owner).call() != "0x" + "0" * 40:
        raise HTTPException(409, "AlreadyActivated")
    price = f.functions.price().call()
    predicted = f.functions.predictVault(owner).call()
    if usdt(conn).functions.balanceOf(predicted).call() < price:
        raise HTTPException(402, "InsufficientFunds")
    fn = f.functions.activateFor(
        owner, req.name, bytes.fromhex(req.code[2:]), Web3.to_checksum_address(req.referrer),
        req.deadline, bytes.fromhex(req.signature[2:]),
    )
    return TxResponse(txHash=send_contract_tx(conn, fn))


@api_router.post("/relay/execute", response_model=TxResponse)
def relay_execute(req: ExecuteRequest):
    if req.deadline < time.time():
        raise HTTPException(400, "Expired")
    conn = w3()
    addr = Web3.to_checksum_address(req.vault)
    if not factory(conn).functions.isVault(addr).call():
        raise HTTPException(404, "UnknownVault")
    rate_limit("exec:" + addr)
    fn = vault(conn, addr).functions.executeMeta(
        bytes.fromhex(req.data[2:]), req.deadline, bytes.fromhex(req.signature[2:])
    )
    return TxResponse(txHash=send_contract_tx(conn, fn))


def _latest_depositor(target: str) -> str:
    """Best-effort: find the sender of the most recent USDT transfer to the vault."""
    try:
        head = LOGS_W3.eth.block_number
        topic_to = "0x" + "0" * 24 + target[2:].lower()
        logs = LOGS_W3.eth.get_logs({
            "fromBlock": head - 3_900, "toBlock": head, "address": USDT_ADDRESS,
            "topics": [TRANSFER_TOPIC, None, topic_to],
        })
        if logs:
            return Web3.to_checksum_address("0x" + logs[-1]["topics"][1].hex()[-40:])
    except Exception as e:  # pragma: no cover - network dependent
        logger.info("depositor lookup failed: %s", e)
    return "0x" + "0" * 40


@api_router.post("/relay/sync")
def relay_sync(req: SyncRequest):
    conn = w3()
    addr = Web3.to_checksum_address(req.vault)
    if not factory(conn).functions.isVault(addr).call():
        raise HTTPException(404, "UnknownVault")
    v = vault(conn, addr)
    summary = v.functions.summary().call()
    balance, accounted = summary[2], summary[3]
    if balance <= accounted:
        return {"synced": False, "txHash": None}
    rate_limit("sync:" + addr)
    hint = _latest_depositor(addr)
    return {"synced": True, "txHash": send_contract_tx(conn, v.functions.sync(hint))}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
