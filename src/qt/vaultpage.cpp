// Copyright (c) 2026 The Shitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <qt/vaultpage.h>

#include <QFont>
#include <QFormLayout>
#include <QGroupBox>
#include <QHBoxLayout>
#include <QLabel>
#include <QPushButton>
#include <QSpacerItem>
#include <QVBoxLayout>

namespace {
// Brand orange, matches the Qt theme.
constexpr char kOrange[] = "#F7931A";

QLabel* makeFactValue(const QString& text, bool bold = true)
{
    QLabel* label = new QLabel(text);
    QFont font = label->font();
    font.setBold(bold);
    font.setPointSize(font.pointSize() + 1);
    label->setFont(font);
    label->setTextInteractionFlags(Qt::TextSelectableByMouse);
    return label;
}
} // namespace

VaultPage::VaultPage(QWidget* parent) : QWidget(parent)
{
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(28, 24, 28, 24);
    mainLayout->setSpacing(16);

    // Title
    QLabel* title = new QLabel(tr("Shitcoin Vault"));
    QFont titleFont = title->font();
    titleFont.setPointSize(titleFont.pointSize() + 8);
    titleFont.setBold(true);
    title->setFont(titleFont);
    mainLayout->addWidget(title);

    QLabel* subtitle = new QLabel(tr("The protocol-level yield reserve. No custodian, no middleman."));
    subtitle->setWordWrap(true);
    mainLayout->addWidget(subtitle);

    // Honest status banner
    QLabel* status = new QLabel(tr("STAKING NOT LIVE YET \u2014 activates with the NEVM upgrade"));
    status->setAlignment(Qt::AlignCenter);
    status->setWordWrap(true);
    status->setStyleSheet(QString(
        "QLabel { background-color: #241304; color: %1; "
        "border: 1px solid %1; border-radius: 8px; "
        "padding: 12px; font-weight: bold; }").arg(kOrange));
    mainLayout->addWidget(status);

    // Key facts
    QGroupBox* factsBox = new QGroupBox(tr("Vault facts"));
    QFormLayout* facts = new QFormLayout(factsBox);
    facts->setSpacing(10);
    facts->addRow(tr("Reserve size:"), makeFactValue(tr("17% of max supply \u2014 3.57B SHIT")));
    facts->addRow(tr("Emission:"), makeFactValue(tr("~47.6M SHIT per year, over 75 years")));
    facts->addRow(tr("Custodian:"), makeFactValue(tr("None \u2014 enforced by consensus")));
    facts->addRow(tr("Eligibility:"), makeFactValue(tr("Hold BTC in the same wallet (any amount)")));
    mainLayout->addWidget(factsBox);

    // How it works (plain language)
    QLabel* explainer = new QLabel(tr(
        "The vault reserve is a number tracked by consensus, not coins sitting in someone's wallet. "
        "It can only ever be paid out as yield to vault stakers \u2014 no person, team, or address "
        "holds the funds and no approval step exists. To earn yield once staking is live, you hold "
        "bitcoin in the same wallet as your SHIT. Any amount of BTC qualifies; the check is done "
        "by the wallet, not by consensus."));
    explainer->setWordWrap(true);
    mainLayout->addWidget(explainer);

    // Disabled CTA: honest, no fake functionality
    QHBoxLayout* buttonRow = new QHBoxLayout();
    buttonRow->addStretch();
    QPushButton* stakeButton = new QPushButton(tr("Staking activates with the NEVM upgrade"));
    stakeButton->setEnabled(false);
    stakeButton->setToolTip(tr("Vault staking is not live yet. This button will enable when the NEVM upgrade activates."));
    buttonRow->addWidget(stakeButton);
    buttonRow->addStretch();
    mainLayout->addLayout(buttonRow);

    mainLayout->addStretch();
}
