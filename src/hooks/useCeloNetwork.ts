import { useCallback, useMemo } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { celo, celoAlfajores } from '../config/celoChains';

const CELO_CHAINS = [celoAlfajores, celo] as const;

export function useCeloNetwork() {
  const activeChainId = useChainId();
  const { chains, switchChain, isPending, status, error } = useSwitchChain();

  const isSupported = useMemo(
    () => CELO_CHAINS.some((chain) => chain.id === activeChainId),
    [activeChainId]
  );

  const activeChain = useMemo(
    () => CELO_CHAINS.find((chain) => chain.id === activeChainId) ?? null,
    [activeChainId]
  );

  const celoMainnet = celo;
  const alfajores = celoAlfajores;

  const switchToCelo = useCallback(() => {
    const target = chains.find((c) => c.id === celoMainnet.id);
    if (target && switchChain) {
      switchChain({ chainId: target.id });
    } else {
      // eslint-disable-next-line no-console
      console.warn('Celo mainnet not available in current wallet or switchChain not supported');
    }
  }, [chains, switchChain, celoMainnet.id]);

  const switchToAlfajores = useCallback(() => {
    const target = chains.find((c) => c.id === alfajores.id);
    if (target && switchChain) {
      switchChain({ chainId: target.id });
    } else {
      // eslint-disable-next-line no-console
      console.warn('Alfajores testnet not available in current wallet or switchChain not supported');
    }
  }, [chains, switchChain, alfajores.id]);

  return {
    activeChainId,
    activeChain,
    isSupported,
    celoMainnet,
    alfajores,
    switchToCelo,
    switchToAlfajores,
    isSwitching: isPending,
    status,
    error
  };
}
