# Lilypad Job POC with Production Controller

This is a pure client‑side proof-of-concept that demonstrates how to interact with the Lilypad system via web3.js. The flow is as follows:

1. **Connect Wallet:**  
   Connect using MetaMask.

2. **Retrieve the Job Creator Address:**  
   - The production controller (testnet) is deployed at `0x4a83270045FB4BCd1bdFe1bD6B00762A9D8bbF4E`.
   - Call its `getJobCreatorAddress()` function to obtain the actual on-chain Job Creator contract address.

3. **Retrieve Job Parameters:**  
   Using the Job Creator contract, retrieve:
   - The ERC‑20 token address (`getTokenAddress()`)
   - The required deposit (`getRequiredDeposit()`)
   - The solver’s (controller) address (`getControllerAddress()`)

4. **Approve Tokens:**  
   Approve the solver to spend the required deposit by calling the token contract’s `approve()`.

5. **Trigger a Job:**  
   Submit a job (in this example, a `cowsay` job) by calling `runJob()` on the Job Creator contract.  
   The transaction’s logs are parsed for a `JobAdded` event to obtain the job ID.

> **Important:**  
> - Because this is an EOA (externally owned account) interacting directly, the on‑chain callback mechanism (via `submitResults`) won’t be received automatically. You will need to monitor events or use an off‑chain system to retrieve the job result.
> - Ensure you’re connected to the correct network (typically Ethereum mainnet for the production controller).

## Files

- **index.html** – The main HTML file that loads web3.js and our app.
- **app.js** – Contains all the logic for connecting the wallet, retrieving the job creator address, approving tokens, and submitting a job.
- **README.md** – This file.

## Running the Application

1. **Update Contract Settings (if needed):**  
   The production controller address is hardcoded. Ensure it is correct and that your MetaMask is connected to the network where it is deployed.

2. **Serve the Files:**  
   This project is entirely client‑side. You can host it on a static web server (e.g., using GitHub Pages, Netlify, or a simple local server). Or just open the `index.html` file in your browser.
   For example, using Python 3:
   ```bash
   python -m http.server 8080
   ```
   