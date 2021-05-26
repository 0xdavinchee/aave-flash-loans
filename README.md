# aave-flash-loans

**Flashloan Mental Model**

1. Contract calls `LendingPool` contract to request a Flash Loan of amount `amounts` of asset `reserves` (e.g. 500 DAI).
2. After some sanity checks, `LendingPool` transfer the requested `amounts` of the `reserves` to calling contract and then calls `executeOperation()` on calling contract or contract specified in `_receiver`.
3. The calling contract now holds the flash loaned `amounts` and executes any arbitrary operation in the code.

- for **'traditional' flash loans**, when code has executed, you transfer `amounts` of `reserves` back to `LendingPool`.
  - `LendingPool` contract updates relevant details of the reserves and **pulls** the flash loaned amount + the 0.09% fee.
  - If amount owing isn't available (due to lack of balance or approval), the transaction is reverted.
  - This is the "optimistic transfer" technique.
- If you are performing a **flash loan to incur debt**, refer to the `mode` parameter in the `flashLoan()` function, then a debt will be incurred.

4. All of the above happens in 1 transaction (and therefore a single ethereum block).

**Applications**

Flash loans are used extensively for swapping and/or migrating positions. Other examples in the wild include:

- **Arbitrage** between assets, without needing to have principal amount to execute the arbitrage.
- **Swapping collateral** of loan positions, without having to repay the debt of the loan positions. I believe this makes sense if the collateral you currently have is dropping in value and you want to exchange it for something like a stable or collateral which you believe will appreciate. This also is akin to adding a passive long.
- **Self-hedging**: can use aave to hedge risk by winding down a debt position (borrow DAI from Aave, pay back part of debt, withdraw some ETH, convert to DAI, payback DAI to Aave)
- **Self-liquidation**: You can write a script to self-liquidate your loans by using flash loans and your own deposit to pay it back. Flash loans aren't free, but it's better to pay a 0.09% fee than 15% liquidation penalty. (get flashloan to pay back what you owe, withdraw collateral, swap enough collateral to pay back flash loan fees)
- **Debt refinancing (interest rate swap)**: you may have a borrow position open on asset `X` on Compound at 10% APR, but it's 5% on dyDx. You can:
  1. borrow asset from aave
  2. payback debt on Comp
  3. withdraw callateral from Comp
  4. deposit collateral on dydx
  5. mint debt on dyDx
  6. return liquidity to Aave.

You are borrowing at a lower rate now.

- **Debt refinancing (currency swap)**: the above shows how to get a lower lending rate on another lending protocol. But you can extend it to swap rate to another currency where rate is lower either temporarily or for the whole loan period by adding an additional txn where the borrow currency is sold to another one.
  e.g.
  1. user has comp loan w/ 8% on DAI borrow
  2. DAI borrowed as flash loan from Aave
  3. Comp borrow closed and eth is unlocked from collateral
  4. ETH sent to dydx where it might be 5% on USDC
  5. USDC borrowed from DyDx
  6. USDC sent to Uni/Kyber and converted back to DAI
  7. DAI flash loan repaid to Aave

You are once again refinancing the loan from 8% DAI to 5% USDC.

**Required Variables in .env**

- AAVE_LENDING_POOL_ADDRESS_PROVIDER
- INFURA_PROJECT_ID
- PRIVATE_KEY
- WETH_KOVAN_ADDRESS
- ETHERSCAN_API_KEY
- CONTRACT_ADDRESS

**Referenced Materials**

- https://docs.aave.com/developers/guides/flash-loans
- https://www.youtube.com/watch?v=Aw7yvGFtOvI
- https://github.com/brownie-mix/aave-flashloan-mix
- https://blog.infura.io/build-a-flash-loan-arbitrage-bot-on-infura-part-i/#flash-loan-vs-flash-swap
- https://blog.infura.io/build-a-flash-loan-arbitrage-bot-on-infura-part-ii/?&utm_source=infurablog&utm_medium=referral&utm_campaign=Tutorials&utm_content=flashbot1
- https://hardhat.org/getting-started/
- http://docs.soliditylang.org
