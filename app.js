window.addEventListener('load', async () => {
    // Grab the logs container and define a helper function for logging.
    const logsDiv = document.getElementById('logs');
    function log(message) {
      const p = document.createElement('p');
      p.textContent = message;
      logsDiv.appendChild(p);
    }
  
    // Check if MetaMask is available.
    if (typeof window.ethereum === 'undefined') {
      log("MetaMask is not available. Please install MetaMask.");
      return;
    } else {
      log("MetaMask is available.");
    }
  
    // Create a web3 instance.
    const web3 = new Web3(window.ethereum);
    let accounts = [];
    let productionControllerContract, jobCreatorContract, tokenContract;
    let requiredDeposit, tokenAddress, controllerAddress;
  
    // -----------------------------------------------------------------
    // Production Controller Address (provided in the docs)
    const PRODUCTION_CONTROLLER_ADDRESS = "0x4a83270045FB4BCd1bdFe1bD6B00762A9D8bbF4E";
    // 0xF2fD1B9b262982F12446149A27d8901Ac68dcB59
    // 0x4a83270045FB4BCd1bdFe1bD6B00762A9D8bbF4E
    // -----------------------------------------------------------------
  
    // Minimal ABI for the production controller (to get the job creator address)
    const productionControllerABI = [
      {
        "inputs": [],
        "name": "getJobCreatorAddress",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  
    // Minimal ABI for the on-chain Job Creator contract
    const jobCreatorABI = [
      {
        "inputs": [],
        "name": "getTokenAddress",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getRequiredDeposit",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getControllerAddress",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "string", "name": "module", "type": "string" },
          { "internalType": "string[]", "name": "inputs", "type": "string[]" },
          { "internalType": "address", "name": "payee", "type": "address" }
        ],
        "name": "runJob",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
          { "indexed": false, "internalType": "address", "name": "calling_contract", "type": "address" },
          { "indexed": false, "internalType": "address", "name": "payee", "type": "address" },
          { "indexed": false, "internalType": "string", "name": "module", "type": "string" },
          { "indexed": false, "internalType": "string[]", "name": "inputs", "type": "string[]" }
        ],
        "name": "JobAdded",
        "type": "event"
      }
    ];
  
    // Minimal ERC‑20 ABI (for approve and allowance)
    const erc20ABI = [
      {
        "constant": false,
        "inputs": [
          { "name": "spender", "type": "address" },
          { "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          { "name": "owner", "type": "address" },
          { "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
      }
    ];
  
    // UI elements.
    const connectButton = document.getElementById('connectButton');
    const approveButton = document.getElementById('approveButton');
    const runJobButton = document.getElementById('runJobButton');
  
    // -----------------------------------------------------------------
    // Connect Wallet and Retrieve Job Creator Address via the Production Controller
    // -----------------------------------------------------------------
    connectButton.addEventListener('click', async () => {
      try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        log("Connected: " + accounts[0]);
  
        // Initialize the production controller contract instance.
        productionControllerContract = new web3.eth.Contract(productionControllerABI, PRODUCTION_CONTROLLER_ADDRESS);
  
        // Call getJobCreatorAddress() to retrieve the actual Job Creator contract address.
        const jobCreatorAddress = await productionControllerContract.methods.getJobCreatorAddress().call();
        log("Retrieved Job Creator Address: " + jobCreatorAddress);
  
        // Now initialize the Job Creator contract using the retrieved address.
        jobCreatorContract = new web3.eth.Contract(jobCreatorABI, jobCreatorAddress);
  
        // Retrieve parameters from the Job Creator contract.
        try {
          tokenAddress = await jobCreatorContract.methods.getTokenAddress().call();
          log("Token Address: " + tokenAddress);
        } catch (err) {
          log("Error getting token address: " + err.message);
        }
        try {
          requiredDeposit = await jobCreatorContract.methods.getRequiredDeposit().call();
          log("Required Deposit: " + requiredDeposit);
        } catch (err) {
          log("Error getting required deposit: " + err.message);
        }
        try {
          controllerAddress = await jobCreatorContract.methods.getControllerAddress().call();
          log("Controller (Solver) Address: " + controllerAddress);
        } catch (err) {
          log("Error getting controller address: " + err.message);
        }
  
        // If we obtained a valid token address, initialize the token contract instance.
        if (tokenAddress) {
          tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress);
        }
  
        // Enable the Approve and Run buttons if all required values were retrieved.
        if (tokenAddress && requiredDeposit && controllerAddress) {
          approveButton.disabled = false;
          runJobButton.disabled = false;
        } else {
          log("Some required values are missing. Check above errors.");
        }
      } catch (error) {
        log("Error connecting wallet or retrieving job creator address: " + error.message);
      }
    });
  
    // -----------------------------------------------------------------
    // Approve Tokens for the Solver
    // -----------------------------------------------------------------
    approveButton.addEventListener('click', async () => {
      try {
        // (Re-)retrieve the controller address in case it has updated.
        const ctrlAddr = await jobCreatorContract.methods.getControllerAddress().call();
        log("Approving tokens for controller: " + ctrlAddr);
        const tx = await tokenContract.methods.approve(ctrlAddr, requiredDeposit).send({
          from: accounts[0]
        });
        log("Tokens approved. Transaction hash: " + tx.transactionHash);
      } catch (error) {
        log("Error approving tokens: " + error.message);
      }
    });
  
    // -----------------------------------------------------------------
    // Trigger a Job (runCowsay)
    // -----------------------------------------------------------------
    runJobButton.addEventListener('click', async () => {
      try {
        const module = "cowsay:v0.0.4";
        const message = prompt("Enter a message for cowsay:", "Hello from Lilypad!");
        if (!message) {
          log("No message provided.");
          return;
        }
        const inputs = ["Message=" + message];
  
        log("Submitting job with message: " + message);
        const tx = await jobCreatorContract.methods.runJob(module, inputs, accounts[0]).send({
          from: accounts[0]
        });
        log("Job submitted. Transaction hash: " + tx.transactionHash);
  
        // Look for the JobAdded event to retrieve the job ID.
        let jobId = null;
        if (tx.events && tx.events.JobAdded) {
          jobId = tx.events.JobAdded.returnValues.id;
          log("JobAdded event detected. Job ID: " + jobId);
        } else {
          log("JobAdded event not found in transaction logs.");
        }
      } catch (error) {
        log("Error triggering job: " + error.message);
      }
    });
  });
  