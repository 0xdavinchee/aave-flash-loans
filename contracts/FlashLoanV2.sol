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
        // at the end of the contract your contract owes the loaned amount + premiums
  ) external override returns (bool) {
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
