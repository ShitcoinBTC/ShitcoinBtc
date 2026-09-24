#include <boost/test/unit_test.hpp>
#include <test/data/nevmspv_valid.json.h>
#include <test/data/nevmspv_invalid.json.h>

#include <uint256.h>
#include <util/strencodings.h>
#include <nevm/nevm.h>
#include <nevm/common.h>
#include <nevm/rlp.h>
#include <nevm/address.h>
#include <nevm/sha3.h>
#include <script/interpreter.h>
#include <script/script.h>
#include <policy/policy.h>
#include <univalue.h>
#include <key_io.h>
#include <test/util/setup_common.h>
#include <test/util/json.h>
#include <validation.h>
#include <consensus/validation.h>
#include <services/assetconsensus.h>
BOOST_FIXTURE_TEST_SUITE(nevm_tests, BasicTestingSetup)
BOOST_AUTO_TEST_CASE(seniority_test)
{
    const auto chainParams = CreateChainParams(*m_node.args, ChainType::MAIN);
    const auto consensusParams = chainParams->GetConsensus();
    const unsigned int sr1Height = consensusParams.nSeniorityHeight1;
    const unsigned int sr2Height = consensusParams.nSeniorityHeight2;
    const int nevmStart = consensusParams.nNEVMStartBlock;
    const double sr1Level = consensusParams.nSeniorityLevel1;
    const double sr2Level = consensusParams.nSeniorityLevel2;
    // Post-NEVM blocks accrue seniority age at 2.5x (see Consensus::Params::Seniority),
    // so from a post-NEVM start the thresholds are hit after ceil(height/2.5) blocks.
    // Integer ceil(a/2.5) = (2*a + 4) / 5.
    const int postNevmSr1Delta = (2 * sr1Height + 4) / 5;
    const int postNevmSr2Delta = (2 * sr2Height + 4) / 5;
    // pre-NEVM era: age accrues 1:1; a genesis masternode has not reached sr1 by NEVM start
    BOOST_CHECK_EQUAL(consensusParams.Seniority(nevmStart, 0), 0);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(nevmStart + 1, 0), 0);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(nevmStart, nevmStart), 0);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(1000000, 1000000), 0);
    // sr1/sr2 boundaries for a masternode started exactly at NEVM start
    const int h1 = nevmStart + postNevmSr1Delta;
    const int h2 = nevmStart + postNevmSr2Delta;
    BOOST_CHECK_EQUAL(consensusParams.Seniority(h1 - 1, nevmStart), 0);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(h1, nevmStart), sr1Level);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(h2 - 1, nevmStart), sr1Level);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(h2, nevmStart), sr2Level);
    // mixed pre/post-NEVM accrual for a masternode started 25000 blocks before NEVM start
    const unsigned int preNevmBlocks = 25000;
    const int startHeight = nevmStart - preNevmBlocks;
    const int t1 = nevmStart + (int)((2 * (sr1Height - preNevmBlocks) + 4) / 5);
    const int t2 = nevmStart + (int)((2 * (sr2Height - preNevmBlocks) + 4) / 5);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(t1 - 1, startHeight), 0);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(t1, startHeight), sr1Level);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(t2 - 1, startHeight), sr1Level);
    BOOST_CHECK_EQUAL(consensusParams.Seniority(t2, startHeight), sr2Level);
}
BOOST_AUTO_TEST_CASE(nevmspv_valid)
{
    tfm::format(std::cout,"Running nevmspv_valid...\n");
    // Read tests from test/data/nevmspv_valid.json
    // Format is an array of arrays
    // Inner arrays are either [ "comment" ]
    // [[spv_root, spv_parent_node, spv_value, spv_path]]

    UniValue tests = read_json(json_tests::nevmspv_valid);

    for (unsigned int idx = 0; idx < tests.size(); idx++) {
        const UniValue &test = tests[idx];
        const std::string strTest = test.write();
        if (test.size() != 4) {
            // ignore comments
            continue;
		} else {
            if ( !test[0].isStr() || !test[1].isStr() || !test[2].isStr() || !test[3].isStr()) {
                BOOST_ERROR("Bad test: " << strTest);
                continue;
            }

            std::string spv_tx_root = test[0].get_str();
            std::string spv_parent_nodes = test[1].get_str();
            std::string spv_value = test[2].get_str();
            std::string spv_path = test[3].get_str();

            const std::vector<unsigned char> vchTxRoot = ParseHex(spv_tx_root);
            dev::RLP rlpTxRoot(&vchTxRoot);
            const std::vector<unsigned char> vchTxParentNodes = ParseHex(spv_parent_nodes);
            dev::RLP rlpTxParentNodes(&vchTxParentNodes);
            const std::vector<unsigned char> vchTxValue = ParseHex(spv_value);
            dev::RLP rlpTxValue(&vchTxValue);
            const std::vector<unsigned char> vchTxPath = ParseHex(spv_path);
            dev::bytesConstRef vchTxPathRef(vchTxPath.data(), vchTxPath.size());
            BOOST_CHECK(VerifyProof(vchTxPathRef, rlpTxValue, rlpTxParentNodes, rlpTxRoot));
        }
    }
}

BOOST_AUTO_TEST_CASE(nevmspv_invalid)
{
    tfm::format(std::cout,"Running nevmspv_invalid...\n");
    // Read tests from test/data/nevmspv_invalid.json
    // Format is an array of arrays
    // Inner arrays are either [ "comment" ]
    // [[spv_root, spv_parent_node, spv_value, spv_path]]

    UniValue tests = read_json(json_tests::nevmspv_invalid);

    for (unsigned int idx = 0; idx < tests.size(); idx++) {
        const UniValue &test = tests[idx];
        const std::string strTest = test.write();
        if (test.size() != 4) {
            // ignore comments
            continue;
        } else {
            if ( !test[0].isStr() || !test[1].isStr() || !test[2].isStr() || !test[3].isStr()) {
                BOOST_ERROR("Bad test: " << strTest);
                continue;
            }
            std::string spv_tx_root = test[0].get_str();
            std::string spv_parent_nodes = test[1].get_str();
            std::string spv_value = test[2].get_str();
            std::string spv_path = test[3].get_str();

            const std::vector<unsigned char> vchTxRoot = ParseHex(spv_tx_root);
            dev::RLP rlpTxRoot(&vchTxRoot);
            const std::vector<unsigned char> vchTxParentNodes = ParseHex(spv_parent_nodes);
            dev::RLP rlpTxParentNodes(&vchTxParentNodes);
            const std::vector<unsigned char> vchTxValue = ParseHex(spv_value);
            dev::RLP rlpTxValue(&vchTxValue);
            const std::vector<unsigned char> vchTxPath = ParseHex(spv_path);
            dev::bytesConstRef vchTxPathRef(vchTxPath.data(), vchTxPath.size());
            BOOST_CHECK(!VerifyProof(vchTxPathRef, rlpTxValue, rlpTxParentNodes, rlpTxRoot));
        }
    }
}
BOOST_AUTO_TEST_SUITE_END()
