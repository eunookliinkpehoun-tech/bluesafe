# Tirelire — Decentralized USDT (BEP20) Vault

## Original problem
Decentralized mobile piggy bank (TrustWallet-like) exclusively for USDT BEP20 on BSC Mainnet.
- 100% non-custodial: BIP39 passphrase (12/24 words, m/44'/60'/0'/0/0). No DB for balances/history.
- Each user gets their own vault smart contract (TirelireFactory -> TirelireVault clone).
- Gasless: backend relayer (deployer wallet) pays BNB gas for deploy/withdraw/transfer/sub-accounts.
- One-time activation fee 50 USDT; referrer receives 60%.
- UI: dark cosmic glassmorphism (from user's 4 HTML mockups: Dashboard, Team, History, Sub-accounts).
- Floating bottom tab bar + central "+" (Add account, Deposit, Withdraw). Side drawer (via avatar) for sub-accounts/settings.
- Languages: EN (default), FR, AR (RTL). User speaks French.

## Architecture
- `/app/contracts`: Solidity + build/deploy scripts. Factory `0xe20E3c436FE624A642Ff241e416D78eA80b61A16` (BSC 56).
- `/app/backend/server.py`: FastAPI stateless relayer. `/api/config`, `/api/relay/status`, `/api/relay/activate`, `/api/relay/execute`, `/api/relay/sync`.
- `/app/frontend`: Expo Router. Auth flow (`welcome`, `create`, `import`, `pin`, `setup`, `activate`, `ref/[code]`) + `(tabs)` (index, history, team, subaccounts). Reads straight from chain with viem; writes are EIP-712 signed locally and relayed.
- Demo mode (mockup data) available from Welcome.

## Done
- Contracts deployed on BSC Mainnet; relayer backend running.
- Full frontend scaffold (screens, drawer, plus menu, sheets, i18n EN/FR/AR).
- Jun 2026: compilation verified, TS errors fixed, RTL `direction` web fix (dirStyle/webDir helpers in theme.ts).

## Known bugs (from test iteration_1, not fixed yet: user asked to stop)
- CRITICAL: PIN lock bypass on reload of deep routes (/activate, /(tabs)...). Fix: global guard in app/_layout.tsx Shell (useSegments + status==='locked' -> /pin?mode=unlock).
- HIGH: "Maximum update depth exceeded" when switching to AR inside the drawer (demo mode). Suspect: Drawer entering/exiting layout animations rebuilt every render (memoize on isRTL).
- MEDIUM: drawer sometimes needs 2 taps after closing another overlay.

## Notes
- backend/.env (relayer private key) is in .gitignore: it must be re-created manually if the repo is cloned elsewhere.

## Backlog
- P0: E2E verification of onboarding + activation with real 50 USDT on mainnet (user to fund).
- P1: Relayer BNB balance monitoring (currently ~0.0011 BNB).
- P2: Push/alerts not requested.
