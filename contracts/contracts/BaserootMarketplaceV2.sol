// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BaserootMarketplaceV2
 * @notice Baseroot PoC — License-first marketplace on Avalanche Fuji.
 *         Revenue split: 40% Creator · 50% DAO · 10% Platform.
 */
contract BaserootMarketplaceV2 is Ownable, ReentrancyGuard {

    // ──────────────────────────── Structs ────────────────────────────

    struct Dataset {
        address owner;
        uint256 pricePerUse;
        bool exists;
    }

    struct Agent {
        address creator;
        string datasetId;
        uint256 price;       // license price in wei (AVAX)
        bool exists;
    }

    struct License {
        address buyer;
        string agentId;
        uint256 purchasedAt;
        bool active;
    }

    // ──────────────────────────── State ──────────────────────────────

    mapping(string => Dataset) public datasets;
    mapping(string => Agent)   public agents;
    mapping(uint256 => License) public licenses;

    uint256 public nextLicenseId;
    address payable public platformWallet;

    // ──────────────────────────── Events ─────────────────────────────

    event DatasetRegistered(
        string datasetId,
        address indexed owner,
        uint256 pricePerUse
    );

    event AgentRegistered(
        string agentId,
        address indexed creator,
        uint256 price,
        string datasetId
    );

    event LicensePurchased(
        uint256 indexed licenseId,
        string agentId,
        address indexed buyer,
        uint256 amount,
        address creator,
        address daoOwner
    );

    event PlatformWalletUpdated(address newWallet);

    // ──────────────────────────── Constructor ────────────────────────

    constructor(
        address initialOwner,
        address payable _platformWallet
    ) Ownable(initialOwner) {
        require(_platformWallet != address(0), "Platform wallet cannot be zero");
        platformWallet = _platformWallet;
    }

    // ──────────────────────────── Admin ──────────────────────────────

    function setPlatformWallet(address payable _wallet) external onlyOwner {
        require(_wallet != address(0), "Platform wallet cannot be zero");
        platformWallet = _wallet;
        emit PlatformWalletUpdated(_wallet);
    }

    // ──────────────────────────── Registration ──────────────────────

    /**
     * @notice DAO registers a dataset.
     * @param _datasetId  Unique dataset identifier (typically Firestore doc ID).
     * @param _pricePerUse  Optional usage fee in wei.
     */
    function registerDataset(
        string calldata _datasetId,
        uint256 _pricePerUse
    ) external {
        require(bytes(_datasetId).length > 0, "Dataset ID cannot be empty");
        require(!datasets[_datasetId].exists,  "Dataset already exists");

        datasets[_datasetId] = Dataset({
            owner: msg.sender,
            pricePerUse: _pricePerUse,
            exists: true
        });

        emit DatasetRegistered(_datasetId, msg.sender, _pricePerUse);
    }

    /**
     * @notice Creator registers an agent linked to one dataset.
     * @param _agentId   Unique agent identifier.
     * @param _price     License price in wei (AVAX).
     * @param _datasetId Dataset the agent is trained on (must exist).
     */
    function registerAgent(
        string calldata _agentId,
        uint256 _price,
        string calldata _datasetId
    ) external {
        require(bytes(_agentId).length > 0,    "Agent ID cannot be empty");
        require(!agents[_agentId].exists,       "Agent already exists");
        require(datasets[_datasetId].exists,    "Dataset does not exist");

        agents[_agentId] = Agent({
            creator: msg.sender,
            datasetId: _datasetId,
            price: _price,
            exists: true
        });

        emit AgentRegistered(_agentId, msg.sender, _price, _datasetId);
    }

    // ──────────────────────────── Purchase ───────────────────────────

    /**
     * @notice Consumer buys a license for an agent.
     *         Funds split: 40% creator · 50% DAO · 10% platform.
     * @param _agentId Agent to purchase license for.
     */
    function buyLicense(string calldata _agentId) external payable nonReentrant {
        Agent storage agent = agents[_agentId];
        require(agent.exists,              "Agent does not exist");
        require(msg.value >= agent.price,  "Insufficient payment");

        // Resolve recipients from stored state (never from user input)
        address payable creator  = payable(agent.creator);
        Dataset storage dataset  = datasets[agent.datasetId];
        address payable daoOwner = payable(dataset.owner);

        // Revenue split
        uint256 creatorShare  = (msg.value * 40) / 100;
        uint256 daoShare      = (msg.value * 50) / 100;
        uint256 platformShare = msg.value - creatorShare - daoShare; // remainder → platform (10%)

        // Transfers
        (bool s1, ) = creator.call{value: creatorShare}("");
        require(s1, "Creator transfer failed");

        (bool s2, ) = daoOwner.call{value: daoShare}("");
        require(s2, "DAO transfer failed");

        (bool s3, ) = platformWallet.call{value: platformShare}("");
        require(s3, "Platform transfer failed");

        // Record license
        uint256 licenseId = nextLicenseId;
        licenses[licenseId] = License({
            buyer: msg.sender,
            agentId: _agentId,
            purchasedAt: block.timestamp,
            active: true
        });
        nextLicenseId++;

        emit LicensePurchased(
            licenseId,
            _agentId,
            msg.sender,
            msg.value,
            creator,
            daoOwner
        );
    }

    // ──────────────────────────── View Helpers ───────────────────────

    function getDataset(string calldata _datasetId)
        external view
        returns (address owner_, uint256 pricePerUse_, bool exists_)
    {
        Dataset storage d = datasets[_datasetId];
        return (d.owner, d.pricePerUse, d.exists);
    }

    function getAgent(string calldata _agentId)
        external view
        returns (address creator_, string memory datasetId_, uint256 price_, bool exists_)
    {
        Agent storage a = agents[_agentId];
        return (a.creator, a.datasetId, a.price, a.exists);
    }

    function getLicense(uint256 _licenseId)
        external view
        returns (address buyer_, string memory agentId_, uint256 purchasedAt_, bool active_)
    {
        License storage l = licenses[_licenseId];
        return (l.buyer, l.agentId, l.purchasedAt, l.active);
    }

    function isLicenseActive(uint256 _licenseId) external view returns (bool) {
        return licenses[_licenseId].active;
    }
}
