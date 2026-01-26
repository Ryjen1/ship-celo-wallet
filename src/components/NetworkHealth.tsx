import { useNetworkHealth } from '../hooks/useNetworkHealth';
import type { RPCEndpoint } from '../types/network';

interface NetworkHealthProps {
  endpoints: RPCEndpoint[];
}

export function NetworkHealth({ endpoints }: NetworkHealthProps) {
  const { data, loading, error } = useNetworkHealth({ endpoints, interval: 30000 });

  if (loading) {
    return (
      <div className="wallet-card">
        <div className="loading-state">
          <div className="loading-spinner" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #60a5fa', borderRadius: '50%' }}></div>
          Loading network health...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-card">
        <div className="error-state">
          <p>Error loading network health: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wallet-card">
        <div className="empty-state">
          <p>No network health data available.</p>
        </div>
      </div>
    );
  }

  const { status, congestionLevel, metrics, lastUpdated } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCongestionWidth = (level: string) => {
    switch (level) {
      case 'low': return '33%';
      case 'medium': return '66%';
      case 'high': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="wallet-card">
      <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Network Health Dashboard</h3>

      {/* Network Status */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(status),
            }}
          ></div>
          <span>Network Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
      </div>

      {/* Congestion Level */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>Congestion Level: {congestionLevel.charAt(0).toUpperCase() + congestionLevel.slice(1)}</div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
          <div
            style={{
              width: getCongestionWidth(congestionLevel),
              height: '100%',
              backgroundColor: congestionLevel === 'high' ? '#ef4444' : congestionLevel === 'medium' ? '#f59e0b' : '#22c55e',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          ></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>RPC Response Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.rpcResponseTime.toFixed(0)} ms</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Block Production Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.blockProductionTime.toFixed(2)} s</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Transaction Success Rate</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.transactionSuccessRate.toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Gas Price Trend</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.gasPriceTrend.charAt(0).toUpperCase() + metrics.gasPriceTrend.slice(1)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Last Block Number</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.lastBlockNumber}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Connected Peers</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.connectedPeerCount}</div>
        </div>
      </div>

      {/* RPC Endpoints */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>RPC Endpoints</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.rpcEndpoints.map((endpoint, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(endpoint.status),
                }}
              ></div>
              <span style={{ fontSize: '0.875rem' }}>{endpoint.url} - {endpoint.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default NetworkHealth;