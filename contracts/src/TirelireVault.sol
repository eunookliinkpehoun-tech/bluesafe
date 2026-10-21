// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

interface ITirelireFactory {
    function isVault(address vault) external view returns (bool);
    function isRelayer(address account) external view returns (bool);
}

interface ITirelireVault {
    function initialize(address owner_, string calldata name_, address token_) external;
    function payActivation(uint256 price, address refVault, uint256 refAmount, address dest) external;
    function credit(uint8 kind, address from, uint256 amount) external;
    function name() external view returns (string memory);
    function activatedAt() external view returns (uint64);
}

/// @title Tirelire Vault - a personal USDT (BEP20) digital piggy bank.
/// @notice One vault (EIP-1167 clone) is deployed per user. Only the owner (signer of
///         the passphrase-derived key) can move funds, directly or through gasless
///         EIP-712 signed requests relayed by anyone. Every operation is recorded on-chain.
contract TirelireVault is EIP712, ITirelireVault {
    using SafeERC20 for IERC20;

    // Entry kinds
    uint8 internal constant K_DEPOSIT = 0;
    uint8 internal constant K_TRANSFER_OUT = 1;
    uint8 internal constant K_WITHDRAW = 2;
    uint8 internal constant K_ALLOCATE = 3;
    uint8 internal constant K_RELEASE = 4;
    uint8 internal constant K_ACTIVATION = 5;
    uint8 internal constant K_REFERRAL = 6;
    uint8 internal constant K_TRANSFER_IN = 7;
    uint8 internal constant K_SUB_CREATED = 8;
    uint8 internal constant K_SUB_CLOSED = 9;

    struct Entry {
        address counterparty;
        uint64 timestamp;
        uint32 subId;
        uint8 kind;
        uint128 amount;
    }

    struct Sub {
        string name;
        uint8 category;
        uint64 createdAt;
        uint64 unlockAt;
        bool closed;
        uint128 balance;
        uint128 target;
    }

    bytes32 private constant EXECUTE_TYPEHASH = keccak256("Execute(bytes data,uint256 nonce,uint256 deadline)");

    address public factory;
    IERC20 public token;
    address public owner;
    string public name;
    uint64 public activatedAt;
    uint256 public accounted; // total balance tracked by the ledger (free + allocated)
    uint256 public allocated; // sum of sub-account balances
    uint256 public nonce; // gasless request nonce

    bool private _meta;
    bool private _locked;
    Entry[] private _entries;
    Sub[] private _subs;

    event Recorded(uint256 indexed index, uint8 indexed kind, address counterparty, uint32 subId, uint256 amount);
    event NameChanged(string name);

    error NotOwner();
    error NotFactory();
    error Expired();
    error BadSignature();
    error InsufficientFunds();
    error InvalidAmount();
    error InvalidRecipient();
    error InvalidSub();
    error SubLocked();
    error InvalidName();
    error Reentrancy();
    error NotAllowed();

    constructor() EIP712("TirelireVault", "1") {
        factory = address(1); // lock the implementation
    }

    modifier onlyOwner() {
        if (!(msg.sender == owner || (msg.sender == address(this) && _meta))) revert NotOwner();
        _;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    modifier guard() {
        if (_locked) revert Reentrancy();
        _locked = true;
        _;
        _locked = false;
    }

    // ------------------------------------------------------------------ init

    function initialize(address owner_, string calldata name_, address token_) external {
        if (factory != address(0)) revert NotAllowed();
        factory = msg.sender;
        owner = owner_;
        name = name_;
        token = IERC20(token_);
        activatedAt = uint64(block.timestamp);
    }

    /// @dev Pays the lifetime activation price from the funds already sent to this address.
    function payActivation(uint256 price, address refVault, uint256 refAmount, address dest) external onlyFactory guard {
        _sync(address(0));
        if (accounted < price) revert InsufficientFunds();
        accounted -= price;
        _record(K_ACTIVATION, address(0), 0, price);
        if (refAmount > 0) token.safeTransfer(refVault, refAmount);
        if (price > refAmount) token.safeTransfer(dest, price - refAmount);
    }

    // --------------------------------------------------------------- gasless

    /// @notice Executes an owner-signed call on this vault. Anyone (the relayer) may submit it and pay gas.
    function executeMeta(bytes calldata data, uint256 deadline, bytes calldata signature) external returns (bytes memory) {
        if (block.timestamp > deadline) revert Expired();
        if (_meta) revert NotAllowed();
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(EXECUTE_TYPEHASH, keccak256(data), nonce, deadline)));
        if (ECDSA.recover(digest, signature) != owner) revert BadSignature();
        nonce++;
        _meta = true;
        (bool ok, bytes memory ret) = address(this).call(data);
        _meta = false;
        if (!ok) {
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
        return ret;
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ------------------------------------------------------------ deposits

    /// @notice Records USDT received by plain BEP20 transfers. The sender hint is only
    ///         accepted from the owner or an approved relayer.
    function sync(address fromHint) external guard {
        bool trusted = msg.sender == owner || (msg.sender == address(this) && _meta) || ITirelireFactory(factory).isRelayer(msg.sender);
        _sync(trusted ? fromHint : address(0));
    }

    function credit(uint8 kind, address from, uint256 amount) external {
        if (msg.sender == address(this)) revert NotAllowed();
        if (msg.sender != factory && !ITirelireFactory(factory).isVault(msg.sender)) revert NotAllowed();
        if (kind != K_TRANSFER_IN && kind != K_REFERRAL) revert NotAllowed();
        uint256 bal = token.balanceOf(address(this));
        if (bal < accounted + amount) revert InvalidAmount();
        uint256 extra = bal - amount - accounted;
        if (extra > 0) {
            accounted += extra;
            _record(K_DEPOSIT, address(0), 0, extra);
        }
        accounted += amount;
        _record(kind, from, 0, amount);
    }

    // ---------------------------------------------------------- main vault

    function transfer(address to, uint256 amount) external onlyOwner guard {
        _send(K_TRANSFER_OUT, to, amount);
    }

    function withdraw(address to, uint256 amount) external onlyOwner guard {
        _send(K_WITHDRAW, to, amount);
    }

    function setName(string calldata newName) external onlyOwner {
        if (bytes(newName).length == 0 || bytes(newName).length > 32) revert InvalidName();
        name = newName;
        emit NameChanged(newName);
    }

    // -------------------------------------------------------- sub-accounts

    function createSub(string calldata subName, uint8 category, uint128 target, uint64 unlockAt) external onlyOwner returns (uint256 id) {
        if (bytes(subName).length == 0 || bytes(subName).length > 48) revert InvalidName();
        if (_subs.length >= 100) revert NotAllowed();
        id = _subs.length;
        _subs.push(Sub(subName, category, uint64(block.timestamp), unlockAt, false, 0, target));
        _record(K_SUB_CREATED, address(0), uint32(id), 0);
    }

    function allocate(uint256 id, uint256 amount) external onlyOwner guard {
        Sub storage s = _openSub(id);
        _sync(address(0));
        if (amount == 0) revert InvalidAmount();
        if (amount > accounted - allocated) revert InsufficientFunds();
        s.balance += uint128(amount);
        allocated += amount;
        _record(K_ALLOCATE, address(0), uint32(id), amount);
    }

    function release(uint256 id, uint256 amount) external onlyOwner guard {
        Sub storage s = _openSub(id);
        if (block.timestamp < s.unlockAt) revert SubLocked();
        if (amount == 0) revert InvalidAmount();
        if (amount > s.balance) revert InsufficientFunds();
        s.balance -= uint128(amount);
        allocated -= amount;
        _record(K_RELEASE, address(0), uint32(id), amount);
    }

    function closeSub(uint256 id) external onlyOwner {
        Sub storage s = _openSub(id);
        if (s.balance != 0) revert NotAllowed();
        s.closed = true;
        _record(K_SUB_CLOSED, address(0), uint32(id), 0);
    }

    // --------------------------------------------------------------- views

    function summary()
        external
        view
        returns (
            address owner_,
            string memory name_,
            uint256 balance,
            uint256 accounted_,
            uint256 allocated_,
            uint256 entryCount,
            uint256 subCount,
            uint256 nonce_,
            uint64 activatedAt_
        )
    {
        return (owner, name, token.balanceOf(address(this)), accounted, allocated, _entries.length, _subs.length, nonce, activatedAt);
    }

    /// @notice Returns ledger entries newest first.
    function getEntries(uint256 offset, uint256 limit) external view returns (Entry[] memory out) {
        uint256 n = _entries.length;
        if (offset >= n) return new Entry[](0);
        uint256 count = n - offset < limit ? n - offset : limit;
        out = new Entry[](count);
        for (uint256 i = 0; i < count; i++) {
            out[i] = _entries[n - 1 - offset - i];
        }
    }

    function getSubs() external view returns (Sub[] memory) {
        return _subs;
    }

    // ------------------------------------------------------------ internal

    function _openSub(uint256 id) internal view returns (Sub storage s) {
        if (id >= _subs.length) revert InvalidSub();
        s = _subs[id];
        if (s.closed) revert InvalidSub();
    }

    function _send(uint8 kind, address to, uint256 amount) internal {
        if (to == address(0) || to == address(this)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        _sync(address(0));
        if (amount > accounted - allocated) revert InsufficientFunds();
        accounted -= amount;
        _record(kind, to, 0, amount);
        token.safeTransfer(to, amount);
        if (ITirelireFactory(factory).isVault(to)) {
            ITirelireVault(to).credit(K_TRANSFER_IN, owner, amount);
        }
    }

    function _sync(address from) internal {
        uint256 bal = token.balanceOf(address(this));
        if (bal > accounted) {
            uint256 d = bal - accounted;
            accounted = bal;
            _record(K_DEPOSIT, from, 0, d);
        }
    }

    function _record(uint8 kind, address counterparty, uint32 subId, uint256 amount) internal {
        _entries.push(Entry(counterparty, uint64(block.timestamp), subId, kind, uint128(amount)));
        emit Recorded(_entries.length - 1, kind, counterparty, subId, amount);
    }
}
