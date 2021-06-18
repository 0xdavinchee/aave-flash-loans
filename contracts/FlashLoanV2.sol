//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.12;

import "hardhat/console.sol";
import {
    FlashLoanReceiverBase
} from "@aave/protocol-v2/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import {
    ILendingPool
} from "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import {
    ILendingPoolAddressesProvider
} from "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Withdrawable.sol";

/**
 * @title FlashLoanV2
 * @dev A basic flash loan contract using Aave.
 * Note: do not keep funds on this contract as they could be exposed to a 'griefing'
 * attack, where stored funds are used by an attacker.
 */
contract FlashLoanV2 is FlashLoanReceiverBase, Withdrawable {
    constructor(ILendingPoolAddressesProvider _addressProvider)
        public
        FlashLoanReceiverBase(_addressProvider)
    {}

    /**
        @dev executeOperation is called after you receive the flashloan
     */
    function executeOperation(
        address[] calldata _assets,
        uint256[] calldata _amounts,
        uint256[] calldata _premiums,
        address _initiator,
        bytes calldata _params
    ) external override returns (bool) {
        
        // v0: do a simple flash loan swap for DAI/ETH, get uniswapPair/sushiswapPairs so you can make a swap
        // e.g. borrow DAI from Aave, exchange DAI for ETH on Uniswap, go to Sushiswap, exchange ETH for DAI
        // sell assetA on Uni

        // v1: do this for DAI/ETH, get uniswapPair/sushiswapPairs so you can make swaps 
        // e.g. if assetA=10 on Uni and assetA=5 on Sushi, buy assetA on Sushi
        // sell assetA on Uni

        // v2: based on the asset(s), get uniswapPair/sushiswapPairs based on asset address
        // so you can make swaps 
        // e.g. if assetA=10 on Uni and assetA=5 on Sushi, buy assetA on Sushi
        // sell assetA on Uni

        // All the smart contract does is literally carry out the flash loan and the actual swaps of the token
        // between exchanges/pairs.
        // The logic for determining whether to carry out the trade will be outside of the smart contract itself,
        // but it will call this smart contract.

        // more profitable strategies, which are complex will involve more steps:
        // for example, borrowing stable coin S from Aave, exchanging it for asset A on exchange X, then either
        // exchanging asset A for stable coin S (at which point it is done) or S1 on the same exchange or another 
        // exchanging stablecoin S1 for another asset B on the most profitable exchange and eventually routing 
        // back to S to pay back to Aave
        // in order to do this with flash loans you'll need to set a bunch of variables in flashloan so that when we
        // go through the executeOperation function (it would have a bunch of if/else statements) based on the variables
        // you can do this without flash loans by creating a contract which has the same logic and you pass in the
        // necessary information needed for the pairs

        // whatever logic you want to do with the funds can be carried out here.
        // at the end of the contract your contract owes the loaned amount + premiums

        // Approve the LendingPool contract allowance to pull owed amount
        for (uint256 i = 0; i < _assets.length; i++) {
            uint256 amountOwing = _amounts[i].add(_premiums[i]);
            IERC20(_assets[i]).approve(address(LENDING_POOL), amountOwing);
        }

        return true;
    }

    function _executeFlashLoan(
        address[] memory _assets,
        uint256[] memory _amounts
    ) internal {
        address receiverAddress = address(this);

        address onBehalfOf = address(this);
        bytes memory params = "";
        uint16 referralCode = 0;
        uint256[] memory modes = new uint256[](_assets.length);
        // 0 = no debt, 1 = stable, 2 = variable
        for (uint256 i = 0; i < _assets.length; i++) {
            modes[i] = 0;
        }

        LENDING_POOL.flashLoan(
            receiverAddress,
            _assets,
            _amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    function flashloan(address[] memory _assets, uint256[] memory _amounts)
        public
    {
        _executeFlashLoan(_assets, _amounts);
    }

    function flashLoan(address _asset) public {
        uint256 amount = 1 ether;

        address[] memory assets = new address[](1);
        assets[0] = _asset;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        _executeFlashLoan(assets, amounts);
    }

    /**
     * @dev Allows the creator of the contract to withdraw assets from the contract.
     * Use address(0) to withdraw ETH.
     */
    function withdrawAssets(address _address) public {
        withdraw(_address);
    }
}
