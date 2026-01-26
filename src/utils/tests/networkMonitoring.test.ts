import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPublicClient } from 'viem';
import {
  checkRPCEndpointHealth,
  measureResponseTime,
  fetchBlockData,
  getGasPrice,
  estimateTransactionSuccessRate,
  checkMultipleEndpoints,
  calculateAverageResponseTime,
  determineCongestionLevel,
} from '../networkMonitoring';
import type { RPCEndpoint } from '../../types/network';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn(),
}));

// Mock viem chains
vi.mock('viem/chains', () => ({
  celo: { id: 42220, name: 'Celo' },
  celoAlfajores: { id: 44787, name: 'Celo Alfajores' },
  celoBaklava: { id: 62320, name: 'Celo Baklava' },
}));

describe('Network Monitoring Utils', () => {
  let mockClient: any;
  let mockEndpoint: RPCEndpoint;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      getBlockNumber: vi.fn(),
      getBlock: vi.fn(),
      getGasPrice: vi.fn(),
    };

    vi.mocked(createPublicClient).mockReturnValue(mockClient);

    mockEndpoint = {
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
    };
  });

  describe('checkRPCEndpointHealth', () => {
    it('should update endpoint metrics on successful health check', async () => {
      mockClient.getBlockNumber.mockResolvedValue(BigInt(12345678));

      await checkRPCEndpointHealth(mockEndpoint);

      expect(mockEndpoint.metrics.responseTime).toBeGreaterThan(0);
      expect(mockEndpoint.metrics.successRate).toBe(100);
      expect(mockEndpoint.metrics.errorCount).toBe(0);
      expect(mockEndpoint.status).toBe('healthy');
      expect(mockEndpoint.isActive).toBe(true);
    });

    it('should update endpoint metrics on failed health check', async () => {
      mockClient.getBlockNumber.mockRejectedValue(new Error('Network error'));

      await checkRPCEndpointHealth(mockEndpoint);

      expect(mockEndpoint.metrics.responseTime).toBeGreaterThan(0);
      expect(mockEndpoint.metrics.successRate).toBe(0);
      expect(mockEndpoint.metrics.errorCount).toBe(1);
      expect(mockEndpoint.status).toBe('down');
      expect(mockEndpoint.isActive).toBe(false);
    });
  });

  describe('measureResponseTime', () => {
    it('should return response time for successful call', async () => {
      mockClient.getBlockNumber.mockResolvedValue(BigInt(12345678));

      const responseTime = await measureResponseTime(mockEndpoint);

      expect(responseTime).toBeGreaterThan(0);
      expect(typeof responseTime).toBe('number');
    });

    it('should return response time for failed call', async () => {
      mockClient.getBlockNumber.mockRejectedValue(new Error('Network error'));

      const responseTime = await measureResponseTime(mockEndpoint);

      expect(responseTime).toBeGreaterThan(0);
      expect(typeof responseTime).toBe('number');
    });
  });

  describe('fetchBlockData', () => {
    it('should fetch block data successfully', async () => {
      const mockBlock = { number: BigInt(12345678), timestamp: BigInt(1234567890) };
      mockClient.getBlockNumber.mockResolvedValue(BigInt(12345678));
      mockClient.getBlock.mockResolvedValue(mockBlock);

      const blocks = await fetchBlockData(mockEndpoint, 3);

      expect(blocks).toHaveLength(3);
      expect(mockClient.getBlock).toHaveBeenCalledTimes(3);
    });

    it('should throw error on failure', async () => {
      mockClient.getBlockNumber.mockRejectedValue(new Error('Network error'));

      await expect(fetchBlockData(mockEndpoint)).rejects.toThrow('Failed to fetch block data');
    });
  });

  describe('getGasPrice', () => {
    it('should return gas price successfully', async () => {
      const gasPrice = BigInt('20000000000');
      mockClient.getGasPrice.mockResolvedValue(gasPrice);

      const result = await getGasPrice(mockEndpoint);

      expect(result).toBe(gasPrice);
    });

    it('should throw error on failure', async () => {
      mockClient.getGasPrice.mockRejectedValue(new Error('Network error'));

      await expect(getGasPrice(mockEndpoint)).rejects.toThrow('Failed to get gas price');
    });
  });

  describe('estimateTransactionSuccessRate', () => {
    it('should estimate success rate based on transaction count', async () => {
      const mockBlock = {
        transactions: Array(10).fill({}), // 10 transactions
      };
      mockClient.getBlock.mockResolvedValue(mockBlock);

      const rate = await estimateTransactionSuccessRate(mockEndpoint);

      expect(rate).toBe(100); // 10 * 10 = 100, capped at 100
    });

    it('should throw error on failure', async () => {
      mockClient.getBlock.mockRejectedValue(new Error('Network error'));

      await expect(estimateTransactionSuccessRate(mockEndpoint)).rejects.toThrow('Failed to estimate success rate');
    });
  });

  describe('checkMultipleEndpoints', () => {
    it('should check all endpoints', async () => {
      const endpoint2 = { ...mockEndpoint, url: 'https://backup.rpc.celo.org' };
      mockClient.getBlockNumber.mockResolvedValue(BigInt(12345678));

      await checkMultipleEndpoints([mockEndpoint, endpoint2]);

      expect(mockClient.getBlockNumber).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateAverageResponseTime', () => {
    it('should calculate average response time', () => {
      const metrics = [
        { responseTime: 100, successRate: 100, lastChecked: new Date(), errorCount: 0 },
        { responseTime: 200, successRate: 100, lastChecked: new Date(), errorCount: 0 },
        { responseTime: 300, successRate: 100, lastChecked: new Date(), errorCount: 0 },
      ];

      const average = calculateAverageResponseTime(metrics);

      expect(average).toBe(200);
    });

    it('should return 0 for empty metrics', () => {
      const average = calculateAverageResponseTime([]);

      expect(average).toBe(0);
    });
  });

  describe('determineCongestionLevel', () => {
    it('should return high congestion for high gas price', () => {
      const gasPrice = BigInt('150000000000'); // 150 gwei
      const responseTime = 1000;

      const level = determineCongestionLevel(gasPrice, responseTime);

      expect(level).toBe('high');
    });

    it('should return high congestion for high response time', () => {
      const gasPrice = BigInt('10000000000'); // 10 gwei
      const responseTime = 6000;

      const level = determineCongestionLevel(gasPrice, responseTime);

      expect(level).toBe('high');
    });

    it('should return medium congestion', () => {
      const gasPrice = BigInt('60000000000'); // 60 gwei
      const responseTime = 3000;

      const level = determineCongestionLevel(gasPrice, responseTime);

      expect(level).toBe('medium');
    });

    it('should return low congestion', () => {
      const gasPrice = BigInt('20000000000'); // 20 gwei
      const responseTime = 1000;

      const level = determineCongestionLevel(gasPrice, responseTime);

      expect(level).toBe('low');
    });
  });
});