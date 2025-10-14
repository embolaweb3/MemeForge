// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PaymentHandler is Ownable, ReentrancyGuard {
    struct ServicePayment {
        address user;
        uint256 amount;
        string serviceType; // "ai_generation", "storage", "ai_and_storage", "mint", "remix"
        uint256 timestamp;
        bool completed;
    }

    // Updated Service fees (in wei)
    uint256 public aiGenerationFee = 0.005 ether; // 0.005 0G
    uint256 public storageFee = 0.001 ether; // 0.001 0G
    uint256 public aiAndStorageFee = 0.006 ether; // 0.006 0G (AI + Storage combined)
    uint256 public mintFee = 0.001 ether; // 0.001 0G
    uint256 public remixFee = 0.0005 ether; // 0.0005 0G

    mapping(address => uint256) public userBalances;
    mapping(bytes32 => ServicePayment) public payments;

    event PaymentReceived(
        address indexed user,
        uint256 amount,
        string serviceType,
        bytes32 paymentId
    );

    event ServiceCompleted(
        bytes32 indexed paymentId,
        address indexed user,
        string serviceType
    );

    event RefundIssued(
        bytes32 indexed paymentId,
        address indexed user,
        uint256 amount
    );

    event FeesUpdated(
        uint256 aiGenerationFee,
        uint256 storageFee,
        uint256 aiAndStorageFee,
        uint256 mintFee,
        uint256 remixFee
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Pay for a service
     */
    function payForService(
        string memory _serviceType
    ) external payable nonReentrant returns (bytes32) {
        uint256 requiredFee = getServiceFee(_serviceType);
        require(msg.value >= requiredFee, "Insufficient payment");

        bytes32 paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                _serviceType,
                block.timestamp,
                block.prevrandao
            )
        );

        payments[paymentId] = ServicePayment({
            user: msg.sender,
            amount: msg.value,
            serviceType: _serviceType,
            timestamp: block.timestamp,
            completed: false
        });

        // Refund excess
        if (msg.value > requiredFee) {
            uint256 refundAmount = msg.value - requiredFee;
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Transfer failed");
        }

        emit PaymentReceived(msg.sender, requiredFee, _serviceType, paymentId);
        return paymentId;
    }

    /**
     * @dev Complete a service
     */
    function completeService(bytes32 _paymentId) external onlyOwner {
        require(payments[_paymentId].user != address(0), "Payment not found");
        require(!payments[_paymentId].completed, "Service already completed");

        payments[_paymentId].completed = true;

        emit ServiceCompleted(
            _paymentId,
            payments[_paymentId].user,
            payments[_paymentId].serviceType
        );
    }

    /**
     * @dev Refund a payment
     */
    function refundPayment(bytes32 _paymentId) external onlyOwner nonReentrant {
        ServicePayment memory payment = payments[_paymentId];
        require(payment.user != address(0), "Payment not found");
        require(!payment.completed, "Service already completed");

        (bool success, ) = payable(payment.user).call{value: payment.amount}("");
        require(success, "Transfer failed");
        payments[_paymentId].completed = true;

        emit RefundIssued(_paymentId, payment.user, payment.amount);
    }

    /**
     * @dev Get fee for a service
     */
    function getServiceFee(
        string memory _serviceType
    ) public view returns (uint256) {
        if (
            keccak256(abi.encodePacked(_serviceType)) ==
            keccak256(abi.encodePacked("ai_generation"))
        ) {
            return aiGenerationFee;
        } else if (
            keccak256(abi.encodePacked(_serviceType)) ==
            keccak256(abi.encodePacked("storage"))
        ) {
            return storageFee;
        } else if (
            keccak256(abi.encodePacked(_serviceType)) ==
            keccak256(abi.encodePacked("ai_and_storage"))
        ) {
            return aiAndStorageFee;
        } else if (
            keccak256(abi.encodePacked(_serviceType)) ==
            keccak256(abi.encodePacked("mint"))
        ) {
            return mintFee;
        } else if (
            keccak256(abi.encodePacked(_serviceType)) ==
            keccak256(abi.encodePacked("remix"))
        ) {
            return remixFee;
        }
        revert("Unknown service type");
    }

    /**
     * @dev Update service fees (owner only)
     */
    function updateFees(
        uint256 _aiFee,
        uint256 _storageFee,
        uint256 _aiAndStorageFee,
        uint256 _mintFee,
        uint256 _remixFee
    ) external onlyOwner {
        aiGenerationFee = _aiFee;
        storageFee = _storageFee;
        aiAndStorageFee = _aiAndStorageFee;
        mintFee = _mintFee;
        remixFee = _remixFee;

        emit FeesUpdated(_aiFee, _storageFee, _aiAndStorageFee, _mintFee, _remixFee);
    }

    /**
     * @dev Get all current fees
     */
    function getAllFees() external view returns (
        uint256 aiFee,
        uint256 storageFeeValue,
        uint256 aiAndStorageFeeValue,
        uint256 mintFeeValue,
        uint256 remixFeeValue
    ) {
        return (
            aiGenerationFee,
            storageFee,
            aiAndStorageFee,
            mintFee,
            remixFee
        );
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}