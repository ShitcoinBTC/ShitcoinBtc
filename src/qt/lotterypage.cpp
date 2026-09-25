// Copyright (c) 2026 The Shitcoin developers
// Lottery page implementation

#include <qt/lotterypage.h>
#include <qt/clientmodel.h>
#include <qt/walletmodel.h>
#include <qt/guiutil.h>

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QPushButton>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QTimer>
#include <QClipboard>
#include <QApplication>

static const QString LOTTERY_ADDRESS = "shit1qkh0zzuxyxnn2lzhezvd3vrgrqw38fa2ej8nmun";
static const QString LOTTERY_API = "https://shitcoinbtc.xyz/lottery.json";

LotteryPage::LotteryPage(QWidget* parent) :
    QWidget(parent)
{
    QVBoxLayout* mainLayout = new QVBoxLayout(this);

    QLabel* title = new QLabel(tr("Daily SHIT Lottery"), this);
    title->setStyleSheet("font-size: 24px; font-weight: bold;");
    title->setAlignment(Qt::AlignCenter);
    mainLayout->addWidget(title);

    QLabel* desc = new QLabel(tr("10 SHIT per ticket. Max 100 tickets per player. 80% to winner, 20% to team. Drawing every 1440 blocks (~12 hours)."), this);
    desc->setWordWrap(true);
    desc->setAlignment(Qt::AlignCenter);
    mainLayout->addWidget(desc);

    // Address
    QHBoxLayout* addrLayout = new QHBoxLayout();
    QLabel* addrLabel = new QLabel(tr("Send tickets to:"), this);
    addrLayout->addWidget(addrLabel);
    QLabel* addrValue = new QLabel(LOTTERY_ADDRESS, this);
    addrValue->setObjectName("lotteryAddress");
    addrValue->setTextInteractionFlags(Qt::TextSelectableByMouse);
    addrLayout->addWidget(addrValue);
    QPushButton* copyBtn = new QPushButton(tr("Copy"), this);
    copyBtn->setObjectName("copyAddressButton");
    connect(copyBtn, &QPushButton::clicked, this, &LotteryPage::on_copyAddressButton_clicked);
    addrLayout->addWidget(copyBtn);
    mainLayout->addLayout(addrLayout);

    // Stats
    QHBoxLayout* statsLayout = new QHBoxLayout();
    QLabel* potLabel = new QLabel(tr("Pot: -"), this);
    potLabel->setObjectName("potLabel");
    potLabel->setStyleSheet("font-size: 18px; font-weight: bold;");
    statsLayout->addWidget(potLabel);
    QLabel* ticketsLabel = new QLabel(tr("Tickets: -"), this);
    ticketsLabel->setObjectName("ticketsLabel");
    ticketsLabel->setStyleSheet("font-size: 18px;");
    statsLayout->addWidget(ticketsLabel);
    QLabel* blocksLabel = new QLabel(tr("Blocks to draw: -"), this);
    blocksLabel->setObjectName("blocksLabel");
    blocksLabel->setStyleSheet("font-size: 18px;");
    statsLayout->addWidget(blocksLabel);
    mainLayout->addLayout(statsLayout);

    // Buy button
    QPushButton* buyBtn = new QPushButton(tr("Buy Ticket (10 SHIT)"), this);
    buyBtn->setObjectName("buyTicketButton");
    buyBtn->setStyleSheet("font-size: 16px; padding: 10px; background-color: #f2a900; font-weight: bold;");
    connect(buyBtn, &QPushButton::clicked, this, &LotteryPage::on_buyTicketButton_clicked);
    mainLayout->addWidget(buyBtn);

    mainLayout->addStretch();

    // Refresh timer
    QTimer* timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &LotteryPage::refreshStats);
    timer->start(60000); // every minute
    refreshStats();
}

LotteryPage::~LotteryPage()
{
}

void LotteryPage::setClientModel(ClientModel* _clientModel)
{
    clientModel = _clientModel;
}

void LotteryPage::setWalletModel(WalletModel* _walletModel)
{
    walletModel = _walletModel;
}

void LotteryPage::on_copyAddressButton_clicked()
{
    QApplication::clipboard()->setText(LOTTERY_ADDRESS);
}

void LotteryPage::on_buyTicketButton_clicked()
{
    // Open send dialog pre-filled - for now just copy address
    // TODO: Integrate with SendCoinsDialog
    QApplication::clipboard()->setText(LOTTERY_ADDRESS);
}

void LotteryPage::refreshStats()
{
    fetchStats();
}

void LotteryPage::fetchStats()
{
    QNetworkAccessManager* mgr = new QNetworkAccessManager(this);
    connect(mgr, &QNetworkAccessManager::finished, this, [this, mgr](QNetworkReply* reply) {
        if (reply->error() == QNetworkReply::NoError) {
            QByteArray data = reply->readAll();
            QJsonDocument doc = QJsonDocument::fromJson(data);
            if (doc.isObject()) {
                QJsonObject obj = doc.object();
                QLabel* potLabel = findChild<QLabel*>("potLabel");
                QLabel* ticketsLabel = findChild<QLabel*>("ticketsLabel");
                QLabel* blocksLabel = findChild<QLabel*>("blocksLabel");
                if (potLabel) potLabel->setText(tr("Pot: %1 SHIT").arg(obj["pot_shit"].toDouble()));
                if (ticketsLabel) ticketsLabel->setText(tr("Tickets: %1").arg(obj["tickets"].toInt()));
                if (blocksLabel) blocksLabel->setText(tr("Blocks to draw: %1").arg(obj["blocks_to_draw"].toInt()));
            }
        }
        reply->deleteLater();
        mgr->deleteLater();
    });
    mgr->get(QNetworkRequest(QUrl(LOTTERY_API)));
}
