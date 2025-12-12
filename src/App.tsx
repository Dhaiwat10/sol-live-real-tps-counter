import { useEffect, useState, useRef } from 'react'
import { Connection } from '@solana/web3.js'

const DEFAULT_RPC = 'https://solana-rpc.publicnode.com'

interface TPSData {
  realTPS: number
  totalTPS: number
  votePercent: number
}

function App() {
  const [rpcUrl, setRpcUrl] = useState(() => {
    const saved = localStorage.getItem('rpcUrl')
    // Reset if using blocked endpoints
    if (saved?.includes('api.mainnet-beta.solana.com') || saved?.includes('ankr.com')) {
      localStorage.removeItem('rpcUrl')
      return DEFAULT_RPC
    }
    return saved || DEFAULT_RPC
  })
  const [inputUrl, setInputUrl] = useState(rpcUrl)
  const [tpsData, setTpsData] = useState<TPSData | null>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [error, setError] = useState<string | null>(null)
  const connectionRef = useRef<Connection | null>(null)

  useEffect(() => {
    connectionRef.current = new Connection(rpcUrl, 'confirmed')
    localStorage.setItem('rpcUrl', rpcUrl)

    const fetchTPS = async () => {
      try {
        const samples = await connectionRef.current!.getRecentPerformanceSamples(5)

        if (!samples || samples.length === 0) {
          throw new Error('No performance samples available')
        }

        const latest = samples[0]
        const realTPS = latest.numNonVoteTransactions / latest.samplePeriodSecs
        const totalTPS = latest.numTransactions / latest.samplePeriodSecs
        const votePercent = ((totalTPS - realTPS) / totalTPS) * 100

        setTpsData({ realTPS, totalTPS, votePercent })
        setStatus('connected')
        setError(null)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    fetchTPS()
    const interval = setInterval(fetchTPS, 1000)

    return () => clearInterval(interval)
  }, [rpcUrl])

  const handleConnect = () => {
    setStatus('connecting')
    setRpcUrl(inputUrl)
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Solana Real TPS</h1>
        <p style={styles.subtitle}>Non-vote transactions only</p>
      </header>

      <div style={styles.tpsDisplay}>
        <span style={styles.tpsValue}>
          {tpsData ? tpsData.realTPS.toFixed(1) : '--'}
        </span>
        <span style={styles.tpsLabel}>TPS</span>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Total TPS</span>
          <span style={styles.statValue}>
            {tpsData ? tpsData.totalTPS.toFixed(1) : '--'}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Vote %</span>
          <span style={styles.statValue}>
            {tpsData ? `${tpsData.votePercent.toFixed(1)}%` : '--'}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Status</span>
          <span style={{
            ...styles.statValue,
            color: status === 'connected' ? '#14F195' : status === 'error' ? '#ff6b6b' : '#8892b0'
          }}>
            {status === 'connected' ? 'Live' : status === 'error' ? 'Error' : 'Connecting...'}
          </span>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.settings}>
        <label style={styles.label}>RPC Endpoint</label>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={styles.input}
            placeholder="https://api.mainnet-beta.solana.com"
          />
          <button onClick={handleConnect} style={styles.button}>
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    margin: 0,
  },
  header: {
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    background: 'linear-gradient(90deg, #9945FF, #14F195)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    color: '#8892b0',
    fontSize: '0.9rem',
    margin: 0,
  },
  tpsDisplay: {
    margin: '3rem 0',
    textAlign: 'center',
  },
  tpsValue: {
    fontSize: '6rem',
    fontWeight: 700,
    color: '#14F195',
    display: 'block',
    lineHeight: 1,
  },
  tpsLabel: {
    fontSize: '1.5rem',
    color: '#8892b0',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    padding: '1.5rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
  },
  stat: {
    textAlign: 'center',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#8892b0',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.2rem',
    fontWeight: 600,
  },
  error: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid #ff6b6b',
    borderRadius: '8px',
    color: '#ff6b6b',
    fontSize: '0.85rem',
    maxWidth: '400px',
    width: '100%',
  },
  settings: {
    marginTop: '2rem',
    padding: '1.5rem',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#8892b0',
    marginBottom: '0.5rem',
  },
  inputGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #333',
    borderRadius: '8px',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '0.9rem',
  },
  button: {
    padding: '0.75rem 1.25rem',
    border: 'none',
    borderRadius: '8px',
    background: '#9945FF',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
}

export default App
