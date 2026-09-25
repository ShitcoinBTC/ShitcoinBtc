// Copyright (c) 2026 The Shitcoin developers
// BIP39 mnemonic implementation for wallet seed phrases

#ifndef SHITCOIN_BIP39_H
#define SHITCOIN_BIP39_H

#include <string>
#include <vector>

namespace bip39 {

/** Convert 256-bit entropy to 24-word BIP39 mnemonic */
std::string EntropyToMnemonic(const std::vector<unsigned char>& entropy);

/** Convert BIP39 mnemonic back to entropy. Returns empty on invalid. */
std::vector<unsigned char> MnemonicToEntropy(const std::string& mnemonic);

/** Validate a BIP39 mnemonic (checksum + wordlist) */
bool ValidateMnemonic(const std::string& mnemonic);

} // namespace bip39

#endif
