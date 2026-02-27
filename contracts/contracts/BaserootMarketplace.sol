// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BaserootMarketplace is Ownable, ReentrancyGuard {
    struct Agent {
        string id;
        address payable creator;
        uint256 price; // In Wei (AVAX)
        string metadata; // IPFS Hash or URL
        bool isActive;
        string[] datasetIds; // For Data Provenance
    }

    struct Dataset {
        string id;
        address payable provider; // DAO or Data Provider Wallet
        uint256 pricePerUse; // In Wei (AVAX) - Optional usage fee
        bool isActive;
    }

    uint256 public agentCount;
    uint256 public platformFeePercent = 10; // 10%
    
    // Changed mapping key to string to match Firestore IDs
    mapping(string => Agent) public agents;
    mapping(string => Dataset) public datasets; 

    event AgentRegistered(string indexed agentId, address indexed creator, uint256 price, string metadata);
    event AgentUpdated(string indexed agentId, uint256 price, string metadata, bool isActive);
    event DatasetRegistered(string indexed datasetId, address indexed provider, uint256 price);
    event ServicePaid(string indexed agentId, address indexed user, uint256 amount, uint256 creditId);
    event PlatformFeeUpdated(uint256 newFeePercent);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerAgent(
        string memory _agentId, // Now accepts string ID
        uint256 _price, 
        string memory _metadata,
        string[] memory _datasetIds
    ) external {
        require(agents[_agentId].creator == address(0), "Agent ID already exists");
        
        agentCount++;

        agents[_agentId] = Agent({
            id: _agentId,
            creator: payable(msg.sender),
            price: _price,
            metadata: _metadata,
            isActive: true, // Active by default
            datasetIds: _datasetIds
        });

        emit AgentRegistered(_agentId, msg.sender, _price, _metadata);
    }

    function updateAgent(string memory _agentId, uint256 _price, string memory _metadata, bool _isActive) external {
        require(agents[_agentId].creator == msg.sender, "Only creator can update agent");
        
        Agent storage agent = agents[_agentId];
        agent.price = _price;
        agent.metadata = _metadata;
        agent.isActive = _isActive;

        emit AgentUpdated(_agentId, _price, _metadata, _isActive);
    }

    function registerDataset(string memory _datasetId, uint256 _pricePerUse) external {
        datasets[_datasetId] = Dataset({
            id: _datasetId,
            provider: payable(msg.sender),
            pricePerUse: _pricePerUse,
            isActive: true
        });

        emit DatasetRegistered(_datasetId, msg.sender, _pricePerUse);
    }

    // Main payment function (Requires Registration)
    function payForService(string memory _agentId) external payable nonReentrant {
        Agent storage agent = agents[_agentId];
        require(agent.isActive, "Agent is not active");
        require(msg.value >= agent.price, "Insufficient payment");

        _distributePayment(msg.value, agent.creator);

        // Generate a pseudo-random Credit ID for off-chain tracking
        uint256 creditId = uint256(keccak256(abi.encodePacked(msg.sender, _agentId, block.timestamp)));

        emit ServicePaid(_agentId, msg.sender, msg.value, creditId);
    }

    // Flexible Payment function (For Agents NOT registered on-chain yet)
    // Allows sending payment to any creator address while still recording the event and taking platform fee.
    // Useful for initial migration where not all agents are on-chain.
    function pay(string memory _agentId, address payable _creator) external payable nonReentrant {
         require(msg.value > 0, "Payment amount must be greater than 0");
         
         // If agent is registered, force using registered creator to prevent spoofing
         if (agents[_agentId].creator != address(0)) {
             require(agents[_agentId].creator == _creator, "Creator mismatch with registered agent");
         }

         _distributePayment(msg.value, _creator);

         uint256 creditId = uint256(keccak256(abi.encodePacked(msg.sender, _agentId, block.timestamp)));
         emit ServicePaid(_agentId, msg.sender, msg.value, creditId);
    }

    function _distributePayment(uint256 _amount, address payable _creator) internal {
        uint256 platformFee = (_amount * platformFeePercent) / 100;
        uint256 creatorShare = _amount - platformFee;

        // Transfer Platform Fee
        (bool successPlatform, ) = payable(owner()).call{value: platformFee}("");
        require(successPlatform, "Platform fee transfer failed");

        // Transfer Creator Share
        (bool successCreator, ) = _creator.call{value: creatorShare}("");
        require(successCreator, "Creator share transfer failed");
    }

    function setPlatformFee(uint256 _percent) external onlyOwner {
        require(_percent <= 30, "Fee too high");
        platformFeePercent = _percent;
        emit PlatformFeeUpdated(_percent);
    }

    // Emergency withdraw
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
