<p align="center">
  <img src="assets/shitcoin-logo.png" width="180" alt="Shitcoin logo">
</p>
<p align="center">
  <img src="doc/shitcoin-wordmark.png" width="420" alt="Shitcoin">
</p>

Shitcoin integration/staging tree
=====================================

Read the [Shitcoin whitepaper](doc/whitepaper.md) ([PDF](doc/whitepaper.pdf)) — merged mining with Bitcoin, the UTXO↔NEVM bridge (Shitbridge), ShitSwap DEX, and the ShitLottery (90% to the winner, 10% burned). NEVM smart contracts live in [contracts/](contracts/).

[![Build Status](https://travis-ci.org/syscoin/syscoin.svg?branch=master)](https://travis-ci.org/syscoin/syscoin)

For an immediately usable, binary version of the Shit Core software, see
https://syscoincore.org/en/download/.

Further information about Shit Core is available in the [doc folder](/doc).

What is Shit Core?
----------------

Shit Core is an experimental digital currency that enables instant payments to anyone, anywhere in the world. shitcoin uses peer-to-peer technology to operate with no central authority: managing transactions and issuing money are carried out collectively by the network. Shit Core is the name of open source software which enables the use of this currency.

For more information, as well as an immediately useable, binary version of the shit Core software, see https://syscoin.org/, or read the [original whitepaper](https://syscoin.org/zdag_syscoin_whitepaper.pdf).

shitcoin is a merge-minable SHA256 coin which provides an array of useful services which leverage the bitcoin protocol and blockchain technology.

Hybrid layer 2 PoW/PoS consensus with bonded validator system (masternodes) ZDAG technology for point-of-sale speeds and probabilistic confirmations useful for microtransactions Trustless sidechain access to [NEVM](https://github.com/syscoin/go-ethereum) and back through a custom permissionless/trustless sidechain technology (Shitbridge) https://github.com/syscoin/sysethereum Decentralized governance (blockchain pays for work via proposals and masternode votes) Digital asset creation and management. ZDAG is open-source and developed over the course of 12 months by [Blockchain Foundry Inc](https://www.blockchainfoundry.co/), with external audit done over 6 months by [Whiteblock](https://whiteblock.io). [Performance report can be found here](https://syscoin.org/tps_whiteblock_syscoin_report.pdf).

Governance formula: We have implemented a % decline schedule — starting the first month with 1500000 SYS and ending on the 24th month with 196708 SYS. After that period, the superblock starts with 151767 SYS a month and will decline 5% every year. Read more about it here: https://medium.com/@syscoin/syscoin-4-0-rewards-specifications-a3dc01d85adf.

Interoptibility between UTXO assets and SHIT-20 NEVM account model through a trust-less, zero custodian, zero counterparty internal bridge (Shitbridge). Documentation can be found [here](https://github.com/syscoin/sysethereum-docs).

For more information, as well as an immediately useable, binary version of
the Shit Core software, see https://syscoin.org/, or read the
[original whitepaper](https://syscoin.org/zdag_syscoin_whitepaper.pdf).

Shitcoin is a merge-minable SHA256 coin which provides an array of useful services which leverage the bitcoin protocol and blockchain technology. It enables turing complete smart contracts running in an [NEVM (Network-enhanced Virtual Machine)](https://github.com/syscoin/go-ethereum) to leverage bitcoin security through merged-mining. Scaling the technology will happen on layer 2 (zkRollups for NEVM and Lightning Networks for UTXO assets).

- Block time: 30 seconds target
- Halving interval: 1051200 (~1 year)
- Max supply: 21,000,000,000 SHIT (21 billion, hard cap)
  - Block 1 allocations: 18% presale (3.78B) + 14% team (2.94B) + 2% coin support (420M) + 6% wrapping reserve (1.26B, backs wrapped SHIT), enforced by consensus
  - Vault yield reserve: 17% (3.57B) as a protocol-level reserve (no custodian) — minted as vault yield, capped at 47.6M SHIT/year over 75 years
  - Native vault: `vaultlock` / `vaultclaim` / `vaultinfo` RPCs; 1–5 year timelocks at 4/6/9/12/15% APY; requires holding any amount of BTC (wallet-enforced)
  - Mining: 43% (9.03B) via block rewards — ~198.07 SHIT per block at launch, deflated 2 percent per year over a 100-year tail (merge-mined with Bitcoin)
  - 10 percent to governance proposals
  - 90 percent split with miner/masternode of which:
    - 25 percent to miner
    - 75 percent to masternode
- 50 percent of the transaction fees paid to masternode
- Masternode minimum subsidy(before seniority): 5.275 shitcoin core (can not go below this amount even accounting for deflation)
- NEVM subsidy (EIP1559): 10.55 Syscoins (static, not deflating)
- SHA256 Proof of Work
- Mineable either exclusively or via merge-mining any SHA256 PoW coin
- Masternode collateral requirement: 100000 
- Masternode seniority: 35 percent increase after 1051200 blocks (~1 year), 100 percent increase after 2628000 blocks (~2.5 years)
- Governance proposals payout schedule: every 17520 blocks (~1 month)
- Governance funding per round (Approx. 2m shit per month to start)
- Governance funding gets 5% deflation per round (superblock). See formula below
- Codebase based off of latest Bitcoin Core (https://github.com/bitcoin/bitcoin)

For more information read the Shity whitepaper.

License
-------

Shit Core is released under the terms of the MIT license. See [COPYING](COPYING) for more
information or see https://opensource.org/licenses/MIT.

Development Process
-------------------

The `master` branch is regularly built (see `doc/build-*.md` for instructions) and tested, but it is not guaranteed to be
completely stable. [Tags](https://github.com/syscoin/syscoin/tags) are created
regularly from release branches to indicate new official, stable release versions of Shit Core.

The https://github.com/syscoin-core/gui repository is used exclusively for the
development of the GUI. Its master branch is identical in all monotree
repositories. Release branches and tags do not exist, so please do not fork
that repository unless it is for development reasons.

The contribution workflow is described in [CONTRIBUTING.md](CONTRIBUTING.md)
and useful hints for developers can be found in [doc/developer-notes.md](doc/developer-notes.md).

Testing
-------

Testing and code review is the bottleneck for development; we get more pull
requests than we can review and test on short notice. Please be patient and help out by testing
other people's pull requests, and remember this is a security-critical project where any mistake might cost people
lots of money.

### Automated Testing

Developers are strongly encouraged to write [unit tests](src/test/README.md) for new code, and to
submit new unit tests for old code. Unit tests can be compiled and run
(assuming they weren't disabled in configure) with: `make check`. Further details on running
and extending unit tests can be found in [/src/test/README.md](/src/test/README.md).

There are also [regression and integration tests](/test), written
in Python.
These tests can be run (if the [test dependencies](/test) are installed) with: `test/functional/test_runner.py`

The CI (Continuous Integration) systems make sure that every pull request is built for Windows, Linux, and macOS,
and that unit/sanity tests are run automatically.

### Manual Quality Assurance (QA) Testing

Changes should be tested by somebody other than the developer who wrote the
code. This is especially important for large or high-risk changes. It is useful
to add a test plan to the pull request description if testing the changes is
not straightforward.

Translations
------------

Changes to translations as well as new translations can be submitted to
[Shit Core's Transifex page](https://www.transifex.com/syscoin/syscoin/).

Translations are periodically pulled from Transifex and merged into the git repository. See the
[translation process](doc/translation_process.md) for details on how this works.

**Important**: We do not accept translation changes as GitHub pull requests because the next
pull from Transifex would automatically overwrite them again.
