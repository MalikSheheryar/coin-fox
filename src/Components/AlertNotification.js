'use client'

import { Component } from 'react'

class AlertNotification extends Component {
  constructor(props) {
    super(props)
    this.state = {
      soundEnabled: localStorage.getItem('alertSoundEnabled') !== 'false',
      animatingAlerts: new Set(),
    }
    this.audioContext = null
  }

  componentDidUpdate(prevProps) {
    // Check for new alerts and play sound/show animation
    const newAlerts = this.props.alerts.filter(
      (alert) =>
        !prevProps.alerts.some((prevAlert) => prevAlert.id === alert.id)
    )

    if (newAlerts.length > 0) {
      newAlerts.forEach((alert) => {
        this.animateAlert(alert.id)
        if (this.state.soundEnabled) {
          this.playNotificationSound()
        }
        this.showBrowserNotification(alert)
      })
    }
  }

  animateAlert = (alertId) => {
    this.setState((prevState) => ({
      animatingAlerts: new Set([...prevState.animatingAlerts, alertId]),
    }))

    setTimeout(() => {
      this.setState((prevState) => {
        const newAnimatingAlerts = new Set(prevState.animatingAlerts)
        newAnimatingAlerts.delete(alertId)
        return { animatingAlerts: newAnimatingAlerts }
      })
    }, 1000)
  }

  playNotificationSound = () => {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)()
      }

      // Create a simple notification sound
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.frequency.setValueAtTime(
        600,
        this.audioContext.currentTime + 0.1
      )

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      )

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  showBrowserNotification = (alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(
        `${alert.coin.toUpperCase()} Price Alert`,
        {
          body: `Price ${alert.type === 'above' ? 'above' : 'below'} ${
            alert.targetPrice
          } ${alert.currency}. Current: ${alert.currentPrice.toFixed(2)} ${
            alert.currency
          }`,
          icon: '/favicon.ico',
          tag: alert.id,
        }
      )

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      setTimeout(() => notification.close(), 5000)
    } else if (
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission()
    }
  }

  toggleSound = () => {
    const newSoundEnabled = !this.state.soundEnabled
    this.setState({ soundEnabled: newSoundEnabled })
    localStorage.setItem('alertSoundEnabled', newSoundEnabled.toString())
  }

  render() {
    const { alerts, onDismiss } = this.props

    if (alerts.length === 0) return null

    return (
      <div
        className="alert-notifications"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          maxWidth: '350px',
        }}
      >
        {/* Sound Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '8px',
          }}
        >
          <button
            onClick={this.toggleSound}
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title={`${
              this.state.soundEnabled ? 'Disable' : 'Enable'
            } notification sounds`}
          >
            {this.state.soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>

        {alerts.map((alert) => {
          const isAnimating = this.state.animatingAlerts.has(alert.id)
          const priceChange = alert.currentPrice - alert.targetPrice
          const changePercent = (priceChange / alert.targetPrice) * 100

          return (
            <div
              key={alert.id}
              className="notification-item"
              style={{
                backgroundColor: '#21ce99',
                color: 'white',
                padding: '16px',
                marginBottom: '8px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease',
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>
                    {alert.type === 'above' ? '🚀' : '📉'}
                  </span>
                  <strong style={{ fontSize: '16px' }}>
                    {alert.coin.toUpperCase()}
                  </strong>
                  <span
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    ALERT
                  </span>
                </div>

                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  <div>
                    <strong>Target:</strong> {alert.targetPrice.toFixed(2)}{' '}
                    {alert.currency}
                  </div>
                  <div>
                    <strong>Current:</strong> {alert.currentPrice.toFixed(2)}{' '}
                    {alert.currency}
                  </div>
                  <div
                    style={{
                      color: priceChange >= 0 ? '#90EE90' : '#FFB6C1',
                      fontWeight: 'bold',
                    }}
                  >
                    {priceChange >= 0 ? '+' : ''}
                    {priceChange.toFixed(2)} ({changePercent >= 0 ? '+' : ''}
                    {changePercent.toFixed(1)}%)
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDismiss(alert.id)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '12px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = 'rgba(255,255,255,0.3)')
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = 'rgba(255,255,255,0.2)')
                }
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    )
  }
}

export default AlertNotification
