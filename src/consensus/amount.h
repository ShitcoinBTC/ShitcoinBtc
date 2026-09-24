// Copyright (c) 2009-2010 Satoshi Nakamoto
// Copyright (c) 2009-2021 The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef SYSCOIN_CONSENSUS_AMOUNT_H
#define SYSCOIN_CONSENSUS_AMOUNT_H
// SYSCOIN
#include <unordered_map>
#include <unordered_set>
#include <cstdint>

/** Amount in satoshis (Can be negative) */
typedef int64_t CAmount;

/** The amount of satoshis in one SYS. */
static constexpr CAmount COIN = 100000000;

/** No amount larger than this (in satoshi) is valid.
 *
 * Note that this constant is *not* the total money supply, which for Shitcoin
 * is 21,000,000,000 SHIT (18% team + 2% coin support + 30% vault yield reserve
 * allocated in block 1, 50% emitted through mining), but rather a sanity
 * check. As this sanity check is used by consensus-critical validation code,
 * the exact value of the MAX_MONEY constant is consensus critical; in unusual
 * circumstances like a(nother) overflow bug that allowed for the creation of
 * coins out of thin air modification could lead to a fork.
 * */
static const CAmount MAX_MONEY = 21000000000LL * COIN;
inline bool MoneyRange(const CAmount& nValue) { return (nValue >= 0 && nValue <= MAX_MONEY); }
typedef std::unordered_map<uint64_t, CAmount> CAssetsMap;
#endif // SYSCOIN_CONSENSUS_AMOUNT_H
