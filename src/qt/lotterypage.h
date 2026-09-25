// Copyright (c) 2026 The Shitcoin developers
// Lottery page for Qt wallet

#ifndef SHITCOIN_QT_LOTTERYPAGE_H
#define SHITCOIN_QT_LOTTERYPAGE_H

#include <QWidget>

class ClientModel;
class WalletModel;

namespace Ui {
    class LotteryPage;
}

class LotteryPage : public QWidget
{
    Q_OBJECT

public:
    explicit LotteryPage(QWidget* parent = nullptr);
    ~LotteryPage();

    void setClientModel(ClientModel* clientModel);
    void setWalletModel(WalletModel* walletModel);

private Q_SLOTS:
    void on_buyTicketButton_clicked();
    void on_copyAddressButton_clicked();
    void refreshStats();

private:
    Ui::LotteryPage* ui;
    ClientModel* clientModel = nullptr;
    WalletModel* walletModel = nullptr;
    void fetchStats();
};

#endif
