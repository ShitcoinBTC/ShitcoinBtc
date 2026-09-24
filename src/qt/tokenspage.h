// Copyright (c) 2026 The Shitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef SYSCOIN_QT_TOKENSPAGE_H
#define SYSCOIN_QT_TOKENSPAGE_H

#include <QWidget>
#include <QList>

#include <functional>
#include <cstdint>

QT_BEGIN_NAMESPACE
class QLabel;
class QLineEdit;
class QPushButton;
class QTableWidget;
class QComboBox;
class QNetworkAccessManager;
class QNetworkReply;
class QJsonArray;
class QJsonValue;
QT_END_NAMESPACE

class WalletModel;

/** Tokens tab: NEVM (EVM-side) balances and SHIT-20 transfers.
 *
 * Talks to the NEVM Geth node's JSON-RPC endpoint (default
 * http://127.0.0.1:8545) for chain data. Transaction signing uses the
 * wallet's own EVM key via WalletModel, so private keys never leave the
 * wallet. All network calls are asynchronous; the UI never blocks.
 */
class TokensPage : public QWidget
{
    Q_OBJECT

public:
    explicit TokensPage(QWidget* parent = nullptr);

    void setWalletModel(WalletModel* walletModel);

private:
    struct TokenInfo {
        QString contract; // 0x-prefixed lowercase hex
        QString symbol;
        int decimals{18};
    };

    WalletModel* walletModel{nullptr};
    QNetworkAccessManager* net{nullptr};

    QLabel* addressLabel{nullptr};
    QLabel* nativeBalanceLabel{nullptr};
    QLabel* chainLabel{nullptr};
    QLabel* statusLabel{nullptr};
    QLineEdit* endpointEdit{nullptr};
    QPushButton* refreshButton{nullptr};
    QTableWidget* tokenTable{nullptr};
    QPushButton* addTokenButton{nullptr};
    QPushButton* removeTokenButton{nullptr};
    QComboBox* sendAssetCombo{nullptr};
    QLineEdit* sendToEdit{nullptr};
    QLineEdit* sendAmountEdit{nullptr};
    QLabel* sendInfoLabel{nullptr};
    QPushButton* sendButton{nullptr};

    QList<TokenInfo> tokens;
    QString evmAddress;
    quint64 chainId{0};
    int rpcId{0};
    bool refreshing{false};

    void loadSettings();
    void saveSettings();
    void rebuildTokenTable();
    void refreshAll();
    void updateEvmAddress();

    // JSON-RPC helper: POSTs to the NEVM endpoint, invokes cb(result, error).
    // Exactly one of result/error is set (error empty on success).
    void rpcCall(const QString& method, const QJsonArray& params,
                 std::function<void(const QJsonValue& result, const QString& error)> cb);

    static bool isValidEvmAddress(const QString& addr);
    static QString normalizeAddress(const QString& addr); // 0x-prefixed lowercase
    // Decimal string -> base units (wei-style) decimal string. ok=false on bad input.
    static QString toBaseUnits(const QString& decimal, int decimals, bool& ok);
    // Base units decimal string -> human decimal string.
    static QString fromBaseUnits(const QString& baseUnits, int decimals);
    static QString pad32Hex(const QString& hexNoPrefix); // left-pad hex to 64 chars
    static QString encodeAddress32(const QString& address); // 0x addr -> 64-hex-char word
    static QString encodeUint256(const QString& decimal); // decimal -> 64-hex-char word
    static QString decodeAbiString(const QString& hexData, bool& ok);
    static int decodeAbiUint8(const QString& hexData, bool& ok);

    void fetchTokenMetadata(const QString& contract);
    void fetchBalances();
    void onSendClicked();
    void setStatus(const QString& msg, bool isError = false);
    void setUiEnabled(bool enabled);

private Q_SLOTS:
    void onRefreshClicked();
    void onAddTokenClicked();
    void onRemoveTokenClicked();
    void onCopyAddressClicked();
};

#endif // SYSCOIN_QT_TOKENSPAGE_H
