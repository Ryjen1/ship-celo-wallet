import { useState, useEffect, useCallback } from 'react';
import { useCeloNetwork } from './useCeloNetwork';
import {
  checkMultipleEndpoints,
  calculateAverageResponseTime,
  determineCongestionLevel,
  fetchBlockData,
  getGasPrice,
  estimateTransactionSuccessRate,
} from '../utils/networkMonitoring';
import type {
  NetworkHealthData,
  RPCEndpoint,
  NetworkHealthMetrics,
  NetworkStatus,
} from '../types/network';

interface UseNetworkHealthOptions {
  interval?: number; // in milliseconds, default 30000
  endpoints: RPCEndpoint[];
}

export function useNetworkHealth(options: UseNetworkHealthOptions) {
  const { currentChainId } = useCeloNetwork();
  const [data, setData] = useState<NetworkHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const interval = options.interval || 30000;
  const endpoints = options.endpoints.filter((e) => e.chainId === currentChainId);

  const fetchHealth = useCallback(async () => {
    if (endpoints.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Check all endpoints for the current chain
      await checkMultipleEndpoints(endpoints);

      // Calculate average response time
      const avgResponseTime = calculateAverageResponseTime(
        endpoints.map((e) => e.metrics)
      );

      // Use the first active endpoint for additional metrics
      const activeEndpoint = endpoints.find((e) => e.isActive);
      let gasPrice = 0n;
      let transactionSuccessRate = 0;
      let blockProductionTime = 0;
      let lastBlockNumber = 0;

      if (activeEndpoint) {
        gasPrice = await getGasPrice(activeEndpoint);
        transactionSuccessRate = await estimateTransactionSuccessRate(activeEndpoint);

        const blocks = await fetchBlockData(activeEndpoint, 10);
        if (blocks.length > 1) {
          // Calculate average block production time in seconds
          const timeDiffs = blocks
            .slice(1)
            .map((block, i) => Number(blocks[i].timestamp - block.timestamp));
          blockProductionTime =
            timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length / 1000;
        }
        lastBlockNumber = Number(blocks[0]?.number || 0);
      }

      // Determine congestion level
      const congestionLevel = determineCongestionLevel(gasPrice, avgResponseTime);

      // Determine overall network status
      const healthyCount = endpoints.filter((e) => e.status === 'healthy').length;
      let status: NetworkStatus;
      if (healthyCount === endpoints.length) {
        status = 'healthy';
      } else if (healthyCount === 0) {
        status = 'down';
      } else {
        status = 'degraded';
      }

      const metrics: NetworkHealthMetrics = {
        rpcResponseTime: avgResponseTime,
        transactionSuccessRate,
        blockProductionTime,
        gasPriceTrend: 'stable', // Placeholder; could be calculated based on historical data
        connectedPeerCount: 0, // Placeholder; requires additional implementation
        lastBlockNumber,
        timestamp: new Date(),
      };

      const healthData: NetworkHealthData = {
        chainId: currentChainId,
        status,
        congestionLevel,
        metrics,
        rpcEndpoints: endpoints,
        lastUpdated: new Date(),
      };

      setData(healthData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [endpoints, currentChainId]);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, interval);
    return () => clearInterval(id);
  }, [fetchHealth, interval]);

  return { data, loading, error };
}