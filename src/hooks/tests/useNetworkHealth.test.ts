import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkHealth } from '../useNetworkHealth';

// Mock the useCeloNetwork hook
vi.mock('../../hooks/useCeloNetwork', () => ({
  useCeloNetwork: vi.fn(),
}));

// Mock the network monitoring utilities
vi.mock('../../utils/networkMonitoring', () => ({
  checkMultipleEndpoints: vi.fn(),
  calculateAverageResponseTime: vi.fn(),
  determineCongestionLevel: vi.fn(),
  fetchBlockData: vi.fn(),
  getGasPrice: vi.fn(),
  estimateTransactionSuccessRate: vi.fn(),
}));

import { useCeloNetwork } from '../../hooks/useCeloNetwork';
import {
  checkMultipleEndpoints,
  calculateAverageResponseTime,
  determineCongestionLevel,
  fetchBlockData,
  getGasPrice,
  estimateTransactionSuccessRate,
} from '../../utils/networkMonitoring';

describe('useNetworkHealth', () => {
  let mockEndpoints: any[];
  let mockUseCeloNetwork: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEndpoints = [
      {
        url: 'https://rpc.celo.org',
        chainId: 42220,
        status: 'healthy',
        metrics: {
          responseTime: 100,
          successRate: 100,
          lastChecked: new Date(),
          errorCount: 0,
        },
        isActive: true,
      },
    ];

    mockUseCeloNetwork = {
      currentChainId: 42220,
    };

    vi.mocked(useCeloNetwork).mockReturnValue(mockUseCeloNetwork);

    // Default successful mocks
    vi.mocked(checkMultipleEndpoints).mockResolvedValue(undefined);
    vi.mocked(calculateAverageResponseTime).mockReturnValue(150);
    vi.mocked(determineCongestionLevel).mockReturnValue('low');
    vi.mocked(fetchBlockData).mockResolvedValue([
      { number: BigInt(12345678), timestamp: BigInt(1234567890) },
      { number: BigInt(12345677), timestamp: BigInt(1234567880) },
    ]);
    vi.mocked(getGasPrice).mockResolvedValue(BigInt('20000000000'));
    vi.mocked(estimateTransactionSuccessRate).mockResolvedValue(95);
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useNetworkHealth({ endpoints: mockEndpoints }));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch health data successfully', async () => {
    const { result } = renderHook(() => useNetworkHealth({ endpoints: mockEndpoints }));

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.chainId).toBe(42220);
    expect(result.current.data?.status).toBe('healthy');
    expect(result.current.data?.congestionLevel).toBe('low');
  });

  it('should handle error during health check', async () => {
    vi.mocked(checkMultipleEndpoints).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNetworkHealth({ endpoints: mockEndpoints }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  it('should filter endpoints by current chain ID', async () => {
    const mixedEndpoints = [
      ...mockEndpoints,
      {
        ...mockEndpoints[0],
        chainId: 44787, // Different chain
      },
    ];

    const { result } = renderHook(() => useNetworkHealth({ endpoints: mixedEndpoints }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(vi.mocked(checkMultipleEndpoints)).toHaveBeenCalledWith(mockEndpoints); // Only 42220 endpoints
  });

  it('should handle no endpoints for current chain', async () => {
    mockUseCeloNetwork.currentChainId = 99999; // Unsupported chain

    const { result } = renderHook(() => useNetworkHealth({ endpoints: mockEndpoints }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
    expect(vi.mocked(checkMultipleEndpoints)).not.toHaveBeenCalled();
  });

  it('should calculate metrics correctly', async () => {
    const { result } = renderHook(() => useNetworkHealth({ endpoints: mockEndpoints }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const data = result.current.data!;
    expect(data.metrics.rpcResponseTime).toBe(150);
    expect(data.metrics.transactionSuccessRate).toBe(95);
    expect(data.metrics.blockProductionTime).toBeCloseTo(10, 1); // Based on mock timestamps
    expect(data.metrics.lastBlockNumber).toBe(12345678);
  });

  it('should determine network status based on endpoint health', async () => {
    // All healthy
    const { result } = renderHook(() => useNetworkHealth({ endpoints: mockEndpoints }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data?.status).toBe('healthy');
  });

  it('should handle custom interval', () => {
    vi.useFakeTimers();

    renderHook(() => useNetworkHealth({ endpoints: mockEndpoints, interval: 5000 }));

    // Initial call
    expect(vi.mocked(checkMultipleEndpoints)).toHaveBeenCalledTimes(1);

    // Advance time
    vi.advanceTimersByTime(5000);

    expect(vi.mocked(checkMultipleEndpoints)).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});