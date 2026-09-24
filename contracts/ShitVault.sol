// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ShitVault
/// @notice Time-locked SHIT vault for the Shitcoin NEVM (chain ID 57).
///         Lock native SHIT for 1 to 5 years. Longer locks earn higher APY,
///         paid from a governance-funded reward pool. Leaving early burns
///         10% of your principal and forfeits rewards — diamond hands only.
///
/// @dev Rewards accrue linearly until the lock expires (not after). If the
///      reward pool runs dry, claims pay out what's available; governance
///      tops the pool up via fundRewards(). Reference implementation —
///      get an audit before mainnet use.
contract ShitVault {
    /// @notice Canonical burn address: provably unspendable.
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_YEARS = 1;
    uint256 public constant MAX_YEARS = 5;
    /// @notice Early-exit penalty in basis points (1000 = 10%, burned).
    uint256 public constant EARLY_EXIT_PENALTY_BPS = 1000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    address public owner;

    /// @notice APY per lock tier, in basis points. Default: 1y=4%, 2y=6%,
    ///         3y=9%, 4y=12%, 5y=15%. Adjustable by governance.
    mapping(uint256 => uint256) public tierAPY;

    struct Lock {
        address owner;
        uint256 principal;
        uint256 startTime;
        uint256 endTime;
        uint256 yearsLocked;
        uint256 rewardsClaimed;
        bool withdrawn;
    }

    Lock[] public locks;
    /// @notice SHIT set aside by governance to pay vault rewards.
    uint256 public rewardPool;

    event Locked(uint256 indexed lockId, address indexed owner, uint256 principal, uint256 yearsLocked, uint256 endTime);
    event RewardsClaimed(uint256 indexed lockId, address indexed owner, uint256 amount);
    event Withdrawn(uint256 indexed lockId, address indexed owner, uint256 principal, uint256 rewards);
    event EmergencyWithdrawn(uint256 indexed lockId, address indexed owner, uint256 returned, uint256 burned);
    event RewardsFunded(uint256 amount, uint256 newPoolBalance);
    event TierAPYUpdated(uint256 yearsLocked, uint256 apyBps);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyLockOwner(uint256 lockId) {
        require(lockId < locks.length, "no such lock");
        require(locks[lockId].owner == msg.sender, "not your lock");
        require(!locks[lockId].withdrawn, "already withdrawn");
        _;
    }

    constructor() {
        owner = msg.sender;
        tierAPY[1] = 400;   // 4%
        tierAPY[2] = 600;   // 6%
        tierAPY[3] = 900;   // 9%
        tierAPY[4] = 1200;  // 12%
        tierAPY[5] = 1500;  // 15%
    }

    /// @notice Governance (or anyone feeling generous) tops up reward funds.
    function fundRewards() external payable onlyOwner {
        require(msg.value > 0, "nothing to fund");
        rewardPool += msg.value;
        emit RewardsFunded(msg.value, rewardPool);
    }

    /// @notice Governance can retune APYs per tier.
    function setTierAPY(uint256 yearsLocked, uint256 apyBps) external onlyOwner {
        require(yearsLocked >= MIN_YEARS && yearsLocked <= MAX_YEARS, "1-5 years");
        tierAPY[yearsLocked] = apyBps;
        emit TierAPYUpdated(yearsLocked, apyBps);
    }

    /// @notice Lock SHIT for `yearsLocked` years (1-5). Returns the lock id.
    function createLock(uint256 yearsLocked) external payable returns (uint256 lockId) {
        require(yearsLocked >= MIN_YEARS && yearsLocked <= MAX_YEARS, "lock 1-5 years");
        require(msg.value > 0, "lock something");

        lockId = locks.length;
        uint256 duration = yearsLocked * SECONDS_PER_YEAR;
        locks.push(Lock({
            owner: msg.sender,
            principal: msg.value,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            yearsLocked: yearsLocked,
            rewardsClaimed: 0,
            withdrawn: false
        }));

        emit Locked(lockId, msg.sender, msg.value, yearsLocked, block.timestamp + duration);
    }

    /// @notice Total rewards earned by a lock so far (minus already claimed).
    function accruedRewards(uint256 lockId) public view returns (uint256) {
        require(lockId < locks.length, "no such lock");
        Lock storage l = locks[lockId];
        if (l.withdrawn) return 0;
        uint256 elapsed = _min(block.timestamp, l.endTime) - l.startTime;
        uint256 gross = (l.principal * tierAPY[l.yearsLocked] * elapsed)
            / BPS_DENOMINATOR
            / SECONDS_PER_YEAR;
        return gross > l.rewardsClaimed ? gross - l.rewardsClaimed : 0;
    }

    /// @notice Claim accrued rewards without unlocking principal.
    function claimRewards(uint256 lockId) external onlyLockOwner(lockId) {
        uint256 amount = accruedRewards(lockId);
        require(amount > 0, "nothing to claim");
        uint256 payout = _min(amount, rewardPool);
        require(payout > 0, "reward pool empty");

        locks[lockId].rewardsClaimed += payout;
        rewardPool -= payout;

        (bool ok, ) = locks[lockId].owner.call{value: payout}("");
        require(ok, "payout failed");
        emit RewardsClaimed(lockId, locks[lockId].owner, payout);
    }

    /// @notice Withdraw after expiry: principal plus all accrued rewards.
    function withdraw(uint256 lockId) external onlyLockOwner(lockId) {
        Lock storage l = locks[lockId];
        require(block.timestamp >= l.endTime, "still locked");

        uint256 rewards = accruedRewards(lockId);
        uint256 payout = _min(rewards, rewardPool);
        l.rewardsClaimed += payout;
        rewardPool -= payout;
        l.withdrawn = true;

        uint256 total = l.principal + payout;
        (bool ok, ) = l.owner.call{value: total}("");
        require(ok, "withdraw failed");
        emit Withdrawn(lockId, l.owner, l.principal, payout);
    }

    /// @notice Chicken out early: 10% of principal is BURNED, rewards forfeited.
    function emergencyWithdraw(uint256 lockId) external onlyLockOwner(lockId) {
        Lock storage l = locks[lockId];
        require(block.timestamp < l.endTime, "use withdraw()");

        uint256 penalty = (l.principal * EARLY_EXIT_PENALTY_BPS) / BPS_DENOMINATOR;
        uint256 returned = l.principal - penalty;
        l.withdrawn = true;

        (bool okBurn, ) = BURN_ADDRESS.call{value: penalty}("");
        require(okBurn, "burn failed");
        (bool okBack, ) = l.owner.call{value: returned}("");
        require(okBack, "return failed");
        emit EmergencyWithdrawn(lockId, l.owner, returned, penalty);
    }

    /// @notice All lock ids owned by an address.
    function locksOf(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < locks.length; i++) {
            if (locks[i].owner == user) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < locks.length; i++) {
            if (locks[i].owner == user) ids[j++] = i;
        }
        return ids;
    }

    function lockCount() external view returns (uint256) {
        return locks.length;
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
