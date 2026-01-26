import { createPublicClient, http, type PublicClient } from 'viem';
import { celo, celoAlfajores, celoBaklava } from 'viem/chains';
import type {
  RPCEndpoint,
  RPCHealthMetrics,
  NetworkHealthMetrics,
  NetworkCongestionLevel,
  NetworkStatus,
} from '../types/network';

const chainMap = {
  42220: celo,
  44787: celoAlfajores,
  62320: celoBaklava,
} as const;

/**
 * Creates a public client for a given RPC endpoint.
 */
function createClient(endpoint: RPCEndpoint): PublicClient {
  const chain = chainMap[endpoint.chainId as keyof typeof chainMap];
  if (!chain) throw new Error(`Unsupported chain ID: ${endpoint.chainId}`);
  return createPublicClient({
    chain,
    transport: http(endpoint.url),
  });
}

/**
 * Performs an RPC health check by attempting to get the latest block number.
 * Updates the endpoint's metrics.
 */
export async function checkRPCEndpointHealth(endpoint: RPCEndpoint): Promise<void> {
  const startTime = Date.now();
  try {
    const client = createClient(endpoint);
    await client.getBlockNumber();
    const responseTime = Date.now() - startTime;
    endpoint.metrics.responseTime = responseTime;
    endpoint.metrics.successRate = 100;
    endpoint.metrics.lastChecked = new Date();
    endpoint.metrics.errorCount = 0;
    endpoint.status = 'healthy';
    endpoint.isActive = true;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    endpoint.metrics.responseTime = responseTime;
    endpoint.metrics.successRate = 0;
    endpoint.metrics.lastChecked = new Date();
    endpoint.metrics.errorCount += 1;
    endpoint.status = 'down';
    endpoint.isActive = false;
  }
}

/**
 * Measures response time for a specific RPC call.
 */
export async function measureResponseTime(endpoint: RPCEndpoint): Promise<number> {
  const startTime = Date.now();
  try {
    const client = createClient(endpoint);
    await client.getBlockNumber();
    return Date.now() - startTime;
  } catch {
    return Date.now() - startTime;
  }
}

/**
 * Fetches block data for timing calculations, including latest block and previous blocks.
 */
export async function fetchBlockData(endpoint: RPCEndpoint, blockCount: number = 10): Promise<any[]> {
  try {
    const client = createClient(endpoint);
    const latestBlockNumber = await client.getBlockNumber();
    const blocks = [];
    for (let i = 0; i < blockCount; i++) {
      const block = await client.getBlock({ blockNumber: latestBlockNumber - BigInt(i) });
      blocks.push(block);
    }
    return blocks;
  } catch (error) {
    throw new Error(`Failed to fetch block data: ${error}`);
  }
}

/**
 * Retrieves the current gas price.
 */
export async function getGasPrice(endpoint: RPCEndpoint): Promise<bigint> {
  try {
    const client = createClient(endpoint);
    return await client.getGasPrice();
  } catch (error) {
    throw new Error(`Failed to get gas price: ${error}`);
  }
}

/**
 * Estimates transaction success rate based on recent transactions.
 * This is a simplified estimation; in practice, analyze more data.
 */
export async function estimateTransactionSuccessRate(endpoint: RPCEndpoint): Promise<number> {
  try {
    const client = createClient(endpoint);
    const latestBlock = await client.getBlock({ blockTag: 'latest' });
    const txCount = latestBlock.transactions.length;
    // Assume success rate based on tx count; this is placeholder logic
    return Math.min(100, txCount * 10); // Arbitrary calculation
  } catch (error) {
    throw new Error(`Failed to estimate success rate: ${error}`);
  }
}

/**
 * Checks multiple RPC endpoints and updates their statuses.
 */
export async function checkMultipleEndpoints(endpoints: RPCEndpoint[]): Promise<void> {
  await Promise.all(endpoints.map(checkRPCEndpointHealth));
}

/**
 * Calculates the average response time from a list of metrics.
 */
export function calculateAverageResponseTime(metrics: RPCHealthMetrics[]): number {
  if (metrics.length === 0) return 0;
  const total = metrics.reduce((sum, m) => sum + m.responseTime, 0);
  return total / metrics.length;
}

/**
 * Determines congestion level based on gas price and response time.
 */
export function determineCongestionLevel(
  gasPrice: bigint,
  averageResponseTime: number
): NetworkCongestionLevel {
  const gasPriceGwei = Number(gasPrice) / 1e9;
  if (gasPriceGwei > 100 || averageResponseTime > 5000) return 'high';
  if (gasPriceGwei > 50 || averageResponseTime > 2000) return 'medium';
  return 'low';
}