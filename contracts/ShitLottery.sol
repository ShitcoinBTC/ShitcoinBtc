// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ShitLottery
/// @notice On-chain lottery for the Shitcoin NEVM (chain ID 57).
///         Players buy tickets with native SHIT. When a round closes, one
///         ticket is picked pseudo-randomly: the winner takes 90% of the pot
///         and 10% is BURNED forever (sent to the canonical burn address).
///
/// @dev Randomness comes from the blockhash of the round's closing block mixed
///      with the round id. This is manipulable by the block producer (they can
///      throw away a block that makes them lose, at the cost of the block
///      reward), so treat this as FUN-grade randomness, not casino-grade.
///      Production upgrade path: replace _drawEntropy with an LLMQ
///      threshold-signature beacon or a VRF oracle. See whitepaper §7.2.
contract ShitLottery {
    /// @notice Canonical burn address: provably unspendable.
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @notice Winner's share of the pot, in basis points (9000 = 90%).
    uint256 public constant WINNER_BPS = 9000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    struct Round {
        uint256 id;            // sequential round number
        uint256 ticketPrice;    // wei of native SHIT per ticket
        uint256 startBlock;     // first block tickets can be bought
        uint256 endBlock;       // last block tickets can be bought (inclusive)
        uint256 ticketCount;    // total tickets sold
        address[] players;      // one entry per ticket (duplicates allowed)
        bool drawn;            // true once the winner is picked
        address winner;        // set after draw
        uint256 pot;           // total SHIT collected (before split)
    }

    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;

    uint256 public ticketPrice;
    uint256 public roundLength; // in blocks

    event RoundStarted(uint256 indexed roundId, uint256 ticketPrice, uint256 startBlock, uint256 endBlock);
    event TicketsBought(uint256 indexed roundId, address indexed buyer, uint256 count);
    event WinnerDrawn(uint256 indexed roundId, address indexed winner, uint256 prize, uint256 burned);

    /// @param _ticketPrice  Price per ticket in wei of native SHIT.
    /// @param _roundLength  How many blocks each round's sale window lasts.
    constructor(uint256 _ticketPrice, uint256 _roundLength) {
        require(_ticketPrice > 0, "price must be > 0");
        require(_roundLength > 0, "round length must be > 0");
        ticketPrice = _ticketPrice;
        roundLength = _roundLength;
        _startRound();
    }

    /// @notice Buy `count` tickets for the current round.
    function buyTickets(uint256 count) external payable {
        Round storage r = rounds[currentRoundId];
        require(block.number >= r.startBlock && block.number <= r.endBlock, "sale closed");
        require(count > 0, "buy at least one ticket");
        require(msg.value == r.ticketPrice * count, "wrong SHIT amount");

        for (uint256 i = 0; i < count; i++) {
            r.players.push(msg.sender);
        }
        r.ticketCount += count;
        r.pot += msg.value;

        emit TicketsBought(r.id, msg.sender, count);
    }

    /// @notice Draw the winner for the current round. Permissionless: anyone
    ///         can call it once the sale window has closed. Starts the next
    ///         round automatically. If nobody bought tickets, the round is
    ///         voided and the next round begins.
    function drawWinner() external {
        Round storage r = rounds[currentRoundId];
        require(block.number > r.endBlock, "round still open");
        require(!r.drawn, "already drawn");
        // blockhash() only works for the 256 most recent blocks.
        require(block.number <= r.endBlock + 256, "draw expired; governance must restart");

        r.drawn = true;

        if (r.ticketCount == 0) {
            emit WinnerDrawn(r.id, address(0), 0, 0);
            _startRound();
            return;
        }

        uint256 entropy = uint256(
            keccak256(abi.encodePacked(blockhash(r.endBlock), r.id, r.ticketCount))
        );
        address winner = r.players[entropy % r.ticketCount];
        r.winner = winner;

        uint256 prize = (r.pot * WINNER_BPS) / BPS_DENOMINATOR;
        uint256 burnAmount = r.pot - prize; // the remaining 10%, rounded in burn's favor

        (bool okPrize, ) = winner.call{value: prize}("");
        require(okPrize, "prize transfer failed");
        (bool okBurn, ) = BURN_ADDRESS.call{value: burnAmount}("");
        require(okBurn, "burn transfer failed");

        emit WinnerDrawn(r.id, winner, prize, burnAmount);
        _startRound();
    }

    /// @notice Read a round's summary (avoids returning the players array).
    function getRound(uint256 roundId)
        external
        view
        returns (
            uint256 id,
            uint256 price,
            uint256 startBlock,
            uint256 endBlock,
            uint256 ticketCount,
            bool drawn,
            address winner,
            uint256 pot
        )
    {
        Round storage r = rounds[roundId];
        return (r.id, r.ticketPrice, r.startBlock, r.endBlock, r.ticketCount, r.drawn, r.winner, r.pot);
    }

    function _startRound() internal {
        currentRoundId += 1;
        uint256 start = block.number;
        rounds[currentRoundId] = Round({
            id: currentRoundId,
            ticketPrice: ticketPrice,
            startBlock: start,
            endBlock: start + roundLength,
            ticketCount: 0,
            players: new address[](0),
            drawn: false,
            winner: address(0),
            pot: 0
        });
        emit RoundStarted(currentRoundId, ticketPrice, start, start + roundLength);
    }
}
