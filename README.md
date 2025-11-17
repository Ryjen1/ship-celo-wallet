# Web3 Wallet Connect + Celo React Starter Kit

A starter kit for building Celo dApps with:

- React + Vite
- TypeScript
- Wagmi + WalletConnect
- Celo mainnet + Alfajores configuration
- Example wallet connect UI
- Basic network status & switching

This project is designed to be forked and extended, especially for the Proof-of-Ship program.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

> Do not commit `.env` to version control.

### 3. Run the dev server

```bash
npm run dev
```

Open the URL printed in the terminal (e.g. `http://localhost:5173`).

## What you get

- **WalletConnect + Injected connectors** via Wagmi
- **Celo configuration** in `src/config/celoChains.ts`
- **WagmiProvider** with React Query in `src/providers/WagmiProvider.tsx`
- **WalletConnectUI** component for connect/disconnect
- **WalletStatus** component with Celo network switching

## Contributing

See `CONTRIBUTING.md` for guidelines and suggested first issues.

## License

MIT
