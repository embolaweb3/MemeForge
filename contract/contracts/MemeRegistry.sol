// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MemeRegistry is Ownable, ReentrancyGuard {
    struct Meme {
        uint256 id;
        address creator;
        string storageHash;
        string imageUrl;
        string caption;
        string prompt;
        uint256 timestamp;
        uint256 likeCount;
        uint256 remixCount;
        uint256 tipAmount;
        bool isAIGenerated;
        bool exists;
    }
    
    struct Remix {
        uint256 id;
        uint256 originalMemeId;
        address remixer;
        string newStorageHash;
        string newCaption;
        uint256 timestamp;
    }
    
    // Constants
    uint256 public constant MINT_FEE = 0.001 ether; // 0.001 ZGS
    uint256 public constant REMIX_FEE = 0.0005 ether; // 0.0005 ZGS
    
    // State variables
    uint256 public memeCounter;
    uint256 public remixCounter;
    uint256 public totalTips;
    
    // Mappings
    mapping(uint256 => Meme) public memes;
    mapping(uint256 => Remix) public remixes;
    mapping(uint256 => mapping(address => bool)) public likes;
    mapping(address => uint256[]) public userMemes;
    mapping(uint256 => uint256[]) public memeRemixes;
    mapping(string => bool) public usedStorageHashes;
    
    // Events
    event MemeCreated(
        uint256 indexed memeId,
        address indexed creator,
        string storageHash,
        string caption,
        uint256 timestamp
    );
    
    event MemeRemixed(
        uint256 indexed remixId,
        uint256 indexed originalMemeId,
        address indexed remixer,
        string newStorageHash,
        string newCaption
    );
    
    event MemeLiked(
        uint256 indexed memeId,
        address indexed liker,
        uint256 newLikeCount
    );
    
    event TipSent(
        uint256 indexed memeId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    event FeePaid(
        address indexed user,
        uint256 amount,
        string serviceType
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new meme with payment
     */
    function createMeme(
        string memory _storageHash,
        string memory _imageUrl,
        string memory _caption,
        string memory _prompt,
        bool _isAIGenerated
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= MINT_FEE, "Insufficient payment");
        require(!usedStorageHashes[_storageHash], "Storage hash already used");
        require(bytes(_storageHash).length > 0, "Storage hash required");
        
        // Check if user sent more than required, refund excess
        if (msg.value > MINT_FEE) {
            payable(msg.sender).transfer(msg.value - MINT_FEE);
        }
        
        memeCounter++;
        uint256 newMemeId = memeCounter;
        
        memes[newMemeId] = Meme({
            id: newMemeId,
            creator: msg.sender,
            storageHash: _storageHash,
            imageUrl: _imageUrl,
            caption: _caption,
            prompt: _prompt,
            timestamp: block.timestamp,
            likeCount: 0,
            remixCount: 0,
            tipAmount: 0,
            isAIGenerated: _isAIGenerated,
            exists: true
        });
        
        usedStorageHashes[_storageHash] = true;
        userMemes[msg.sender].push(newMemeId);
        
        emit MemeCreated(newMemeId, msg.sender, _storageHash, _caption, block.timestamp);
        emit FeePaid(msg.sender, MINT_FEE, "meme_creation");
        
        return newMemeId;
    }
    
    /**
     * @dev Remix an existing meme
     */
    function remixMeme(
        uint256 _originalMemeId,
        string memory _newStorageHash,
        string memory _newCaption
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= REMIX_FEE, "Insufficient payment for remix");
        require(memes[_originalMemeId].exists, "Original meme doesn't exist");
        require(!usedStorageHashes[_newStorageHash], "Storage hash already used");
        
        // Refund excess
        if (msg.value > REMIX_FEE) {
            payable(msg.sender).transfer(msg.value - REMIX_FEE);
        }
        
        remixCounter++;
        uint256 newRemixId = remixCounter;
        
        remixes[newRemixId] = Remix({
            id: newRemixId,
            originalMemeId: _originalMemeId,
            remixer: msg.sender,
            newStorageHash: _newStorageHash,
            newCaption: _newCaption,
            timestamp: block.timestamp
        });
        
        // Update original meme remix count
        memes[_originalMemeId].remixCount++;
        usedStorageHashes[_newStorageHash] = true;
        memeRemixes[_originalMemeId].push(newRemixId);
        
        emit MemeRemixed(newRemixId, _originalMemeId, msg.sender, _newStorageHash, _newCaption);
        emit FeePaid(msg.sender, REMIX_FEE, "meme_remix");
        
        return newRemixId;
    }
    
    /**
     * @dev Like a meme (free but requires gas)
     */
    function likeMeme(uint256 _memeId) external {
        require(memes[_memeId].exists, "Meme doesn't exist");
        require(!likes[_memeId][msg.sender], "Already liked");
        
        likes[_memeId][msg.sender] = true;
        memes[_memeId].likeCount++;
        
        emit MemeLiked(_memeId, msg.sender, memes[_memeId].likeCount);
    }
    
    /**
     * @dev Tip a meme creator
     */
    function tipCreator(uint256 _memeId) external payable nonReentrant {
        require(memes[_memeId].exists, "Meme doesn't exist");
        require(msg.value > 0, "Tip amount must be positive");
        require(msg.sender != memes[_memeId].creator, "Cannot tip yourself");
        
        address creator = memes[_memeId].creator;
        memes[_memeId].tipAmount += msg.value;
        totalTips += msg.value;
        
        payable(creator).transfer(msg.value);
        
        emit TipSent(_memeId, msg.sender, creator, msg.value);
    }
    
    /**
     * @dev Get meme details
     */
    function getMeme(uint256 _memeId) external view returns (Meme memory) {
        require(memes[_memeId].exists, "Meme doesn't exist");
        return memes[_memeId];
    }
    
    /**
     * @dev Get remixes for a meme
     */
    function getMemeRemixes(uint256 _memeId) external view returns (Remix[] memory) {
        uint256[] memory remixIds = memeRemixes[_memeId];
        Remix[] memory memeRemixesList = new Remix[](remixIds.length);
        
        for (uint256 i = 0; i < remixIds.length; i++) {
            memeRemixesList[i] = remixes[remixIds[i]];
        }
        
        return memeRemixesList;
    }
    
    /**
     * @dev Get user's memes
     */
    function getUserMemes(address _user) external view returns (Meme[] memory) {
        uint256[] memory userMemeIds = userMemes[_user];
        Meme[] memory userMemeList = new Meme[](userMemeIds.length);
        
        for (uint256 i = 0; i < userMemeIds.length; i++) {
            userMemeList[i] = memes[userMemeIds[i]];
        }
        
        return userMemeList;
    }
    
    /**
     * @dev Check if user liked a meme
     */
    function hasLiked(uint256 _memeId, address _user) external view returns (bool) {
        return likes[_memeId][_user];
    }
    
    /**
     * @dev Withdraw contract funds (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

}