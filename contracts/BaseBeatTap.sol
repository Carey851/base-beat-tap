// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BaseBeatTap {
    mapping(address => uint8) public latestBeat;
    mapping(address => uint256) public userBeats;
    mapping(uint8 => uint256) public beatCounts;
    uint256 public totalBeats;

    event BeatDropped(address indexed user, uint8 beat, uint256 userBeats, uint256 totalBeats);

    function dropBeat(uint8 beat) external {
        require(beat < 4, "Invalid beat");

        latestBeat[msg.sender] = beat;

        unchecked {
            userBeats[msg.sender] += 1;
            beatCounts[beat] += 1;
            totalBeats += 1;
        }

        emit BeatDropped(msg.sender, beat, userBeats[msg.sender], totalBeats);
    }
}
