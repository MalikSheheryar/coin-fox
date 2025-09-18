import { Component } from 'react'

class RealTimeStatus extends Component {
  render() {
    const { isConnected, lastUpdate, nextUpdate, alertCount } = this.props
    const now = Date.now()
    const timeSinceUpdate = Math.floor((now - lastUpdate) / 1000)
    const timeToNextUpdate = Math.max(0, Math.floor((nextUpdate - now) / 1000))

    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 999,
          minWidth: '200px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#21ce99' : '#d82d2d',
            }}
          ></div>
          <span style={{ fontWeight: 'bold' }}>
            {isConnected ? 'Live Updates' : 'Disconnected'}
          </span>
        </div>

        <div style={{ opacity: 0.8 }}>Last update: {timeSinceUpdate}s ago</div>

        {isConnected && (
          <div style={{ opacity: 0.8 }}>Next update: {timeToNextUpdate}s</div>
        )}

        {alertCount > 0 && (
          <div
            style={{
              marginTop: '4px',
              padding: '2px 6px',
              backgroundColor: '#ffa500',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            {alertCount} active alerts
          </div>
        )}
      </div>
    )
  }
}

export default RealTimeStatus
