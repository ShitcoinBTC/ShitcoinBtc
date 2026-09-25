// Copyright (c) 2026 The Shitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef SYSCOIN_QT_VAULTPAGE_H
#define SYSCOIN_QT_VAULTPAGE_H

#include <QWidget>

/** Vault tab: honest info panel about the Shitcoin vault yield reserve.
 *
 * Staking is NOT live yet. This page describes the reserve and shows a
 * clear "activates with the NEVM upgrade" status. No fake stake button,
 * no pretend functionality.
 */
class VaultPage : public QWidget
{
public:
    explicit VaultPage(QWidget* parent = nullptr);
};

#endif // SYSCOIN_QT_VAULTPAGE_H
