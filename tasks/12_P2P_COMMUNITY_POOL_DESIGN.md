# 12_P2P_COMMUNITY_POOL_DESIGN

## Objective
Prototype P2P resource sharing via WebRTC data channels with libp2p transport.

## Outputs
- Demo: peer-to-peer task handoff; signaling server.

## Steps
- Implement WebRTC data channels (ICE/STUN/TURN), plus libp2p WebRTC transport.
- Recovery via relay/TURN.

## Acceptance Criteria
- P2P handoff works; disconnection recovers through relay.
