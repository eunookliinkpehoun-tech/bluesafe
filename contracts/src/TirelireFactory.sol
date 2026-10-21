// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ITirelireVault} from "./TirelireVault.sol";

/// @title Tirelire Factory - deploys one personal vault per user and pays referral commissions.
contract TirelireFactory is EIP712 {
    using SafeERC20 for IERC20;

    bytes32 private constant ACTIVATE_TYPEHASH =
        keccak256("Activate(address owner,string name,bytes32 code,address referrer,uint256 deadline)");

    struct ReferralInfo {
        address owner;
        address vault;
        string name;
        uint64 joinedAt;
        uint256 earned;
        uint256 balance;
    }

    address public immutable implementation;
    IERC20 public immutable token;

    address public admin;
    address public treasury; // when unset, the company share is held here until sweep()
    uint256 public price;
    uint16 public referralBps;
    uint256 public held;

    mapping(address => bool) public isRelayer;
    mapping(address => address) public vaultOf; // owner -> vault
    mapping(address => address) public ownerOf; // vault -> owner
    mapping(bytes32 => address) public codeOwner;
    mapping(address => bytes32) public codeOf;
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public totalEarned; // referrer -> commissions
    mapping(address => uint256) public earnedFrom; // referee -> commission paid to its referrer
    mapping(address => address[]) private _referrals;
    address[] public allOwners;

    event Activated(address indexed owner, address indexed vault, address indexed referrer, bytes32 code, uint256 price, uint256 commission);
    event ConfigChanged(uint256 price, uint16 referralBps, address treasury);
    event RelayerSet(address relayer, bool allowed);
    event AdminChanged(address admin);
    event Swept(address to, uint256 amount);

    error NotAdmin();
    error Expired();
    error BadSignature();
    error AlreadyActivated();
    error InvalidName();
    error InvalidCode();
    error InvalidReferrer();
    error InvalidConfig();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address token_, address implementation_, uint256 price_, uint16 referralBps_) EIP712("TirelireFactory", "1") {
        if (referralBps_ > 10_000) revert InvalidConfig();
        token = IERC20(token_);
        implementation = implementation_;
        price = price_;
        referralBps = referralBps_;
        admin = msg.sender;
        isRelayer[msg.sender] = true;
        emit RelayerSet(msg.sender, true);
        emit ConfigChanged(price_, referralBps_, address(0));
    }

    // ------------------------------------------------------------ activation

    function predictVault(address owner) public view returns (address) {
        return Clones.predictDeterministicAddress(implementation, _salt(owner));
    }

    function activate(string calldata name, bytes32 code, address referrer) external returns (address) {
        return _activate(msg.sender, name, code, referrer);
    }

    /// @notice Gasless activation: the owner signs, anyone (the relayer) submits and pays gas.
    function activateFor(
        address owner,
        string calldata name,
        bytes32 code,
        address referrer,
        uint256 deadline,
        bytes calldata signature
    ) external returns (address) {
        if (block.timestamp > deadline) revert Expired();
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(ACTIVATE_TYPEHASH, owner, keccak256(bytes(name)), code, referrer, deadline))
        );
        if (ECDSA.recover(digest, signature) != owner) revert BadSignature();
        return _activate(owner, name, code, referrer);
    }

    function _activate(address owner, string calldata name, bytes32 code, address referrer) internal returns (address vault) {
        if (owner == address(0) || vaultOf[owner] != address(0)) revert AlreadyActivated();
        if (bytes(name).length == 0 || bytes(name).length > 32) revert InvalidName();
        if (code == bytes32(0) || codeOwner[code] != address(0)) revert InvalidCode();
        if (referrer != address(0) && (referrer == owner || vaultOf[referrer] == address(0))) revert InvalidReferrer();

        vault = Clones.cloneDeterministic(implementation, _salt(owner));
        ITirelireVault(vault).initialize(owner, name, address(token));

        vaultOf[owner] = vault;
        ownerOf[vault] = owner;
        codeOwner[code] = owner;
        codeOf[owner] = code;
        allOwners.push(owner);

        address refVault;
        uint256 commission;
        if (referrer != address(0)) {
            referrerOf[owner] = referrer;
            _referrals[referrer].push(owner);
            refVault = vaultOf[referrer];
            commission = (price * referralBps) / 10_000;
        }

        if (price > 0) {
            address dest = treasury == address(0) ? address(this) : treasury;
            ITirelireVault(vault).payActivation(price, refVault, commission, dest);
            if (dest == address(this)) held += price - commission;
            if (commission > 0) {
                totalEarned[referrer] += commission;
                earnedFrom[owner] = commission;
                ITirelireVault(refVault).credit(6, owner, commission);
            }
        }

        emit Activated(owner, vault, referrer, code, price, commission);
    }

    // ----------------------------------------------------------------- views

    function isVault(address vault) external view returns (bool) {
        return ownerOf[vault] != address(0);
    }

    function totalVaults() external view returns (uint256) {
        return allOwners.length;
    }

    function referralCount(address referrer) external view returns (uint256) {
        return _referrals[referrer].length;
    }

    function getReferrals(address referrer, uint256 offset, uint256 limit) external view returns (ReferralInfo[] memory out) {
        address[] storage list = _referrals[referrer];
        uint256 n = list.length;
        if (offset >= n) return new ReferralInfo[](0);
        uint256 count = n - offset < limit ? n - offset : limit;
        out = new ReferralInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            address o = list[n - 1 - offset - i];
            address v = vaultOf[o];
            out[i] = ReferralInfo(o, v, ITirelireVault(v).name(), ITirelireVault(v).activatedAt(), earnedFrom[o], token.balanceOf(v));
        }
    }

    function info()
        external
        view
        returns (uint256 price_, uint16 referralBps_, address treasury_, uint256 held_, uint256 vaults_, address admin_)
    {
        return (price, referralBps, treasury, held, allOwners.length, admin);
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ----------------------------------------------------------------- admin

    function setTreasury(address treasury_) external onlyAdmin {
        treasury = treasury_;
        emit ConfigChanged(price, referralBps, treasury_);
    }

    function setPrice(uint256 price_) external onlyAdmin {
        price = price_;
        emit ConfigChanged(price_, referralBps, treasury);
    }

    function setReferralBps(uint16 bps) external onlyAdmin {
        if (bps > 10_000) revert InvalidConfig();
        referralBps = bps;
        emit ConfigChanged(price, bps, treasury);
    }

    function setRelayer(address relayer, bool allowed) external onlyAdmin {
        isRelayer[relayer] = allowed;
        emit RelayerSet(relayer, allowed);
    }

    function setAdmin(address admin_) external onlyAdmin {
        if (admin_ == address(0)) revert InvalidConfig();
        admin = admin_;
        emit AdminChanged(admin_);
    }

    /// @notice Sends the held company share to the treasury once it is configured.
    function sweep() external onlyAdmin {
        if (treasury == address(0)) revert InvalidConfig();
        uint256 amount = held;
        held = 0;
        token.safeTransfer(treasury, amount);
        emit Swept(treasury, amount);
    }

    function _salt(address owner) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(owner)));
    }
}
