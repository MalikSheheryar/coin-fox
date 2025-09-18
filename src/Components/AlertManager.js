'use client'

import { Component } from 'react'
import { translationStrings } from '../Utils/i18n'
import { $currencySymbol, $numberWithCommas } from '../Utils/Helpers'

class AlertManager extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: 'all',
      sortBy: 'created',
    }
  }

  getFilteredAndSortedAlerts = () => {
    let filtered = this.props.alerts

    // Apply filter
    if (this.state.filter !== 'all') {
      filtered = filtered.filter((alert) => alert.status === this.state.filter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.state.sortBy) {
        case 'coin':
          return a.coin.localeCompare(b.coin)
        case 'price':
          return b.targetPrice - a.targetPrice
        case 'created':
        default:
          return b.createdAt - a.createdAt
      }
    })

    return filtered
  }

  getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#21ce99'
      case 'triggered':
        return '#ffa500'
      case 'dismissed':
        return '#666'
      default:
        return '#333'
    }
  }

  getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🔔'
      case 'triggered':
        return '⚠️'
      case 'dismissed':
        return '🔕'
      default:
        return '❓'
    }
  }

  formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString()
  }

  getCurrentPrice = (coin) => {
    const coinData = this.props.marketData[coin]
    if (!coinData || !coinData.ticker) return 0
    return coinData.ticker.price * this.props.exchangeRate
  }

  render() {
    const string = translationStrings(this.props.language)
    const curSymbol = $currencySymbol(this.props.currency)
    const alerts = this.getFilteredAndSortedAlerts()

    const statusCounts = {
      all: this.props.alerts.length,
      active: this.props.alerts.filter((a) => a.status === 'active').length,
      triggered: this.props.alerts.filter((a) => a.status === 'triggered')
        .length,
      dismissed: this.props.alerts.filter((a) => a.status === 'dismissed')
        .length,
    }

    return (
      <div className="alert-manager" style={{ padding: '20px' }}>
        <div className="alert-header" style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#333', marginBottom: '16px' }}>
            Alert Management
          </h2>

          {/* Filter Tabs */}
          <div
            className="filter-tabs"
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            {['all', 'active', 'triggered', 'dismissed'].map((filter) => (
              <button
                key={filter}
                onClick={() => this.setState({ filter })}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '20px',
                  backgroundColor:
                    this.state.filter === filter ? '#21ce99' : '#f0f0f0',
                  color: this.state.filter === filter ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: this.state.filter === filter ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)} (
                {statusCounts[filter]})
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div
            className="sort-options"
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <span style={{ color: '#666', fontSize: '14px' }}>Sort by:</span>
            <select
              value={this.state.sortBy}
              onChange={(e) => this.setState({ sortBy: e.target.value })}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#333',
                fontSize: '14px',
              }}
            >
              <option value="created">Date Created</option>
              <option value="coin">Coin</option>
              <option value="price">Target Price</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="alerts-list">
          {alerts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
              }}
            >
              <h3>No alerts found</h3>
              <p>
                {this.state.filter === 'all'
                  ? "You haven't set up any price alerts yet."
                  : `No ${this.state.filter} alerts found.`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {alerts.map((alert) => {
                const currentPrice = this.getCurrentPrice(alert.coin)
                const priceDirection = alert.type === 'above' ? '↗️' : '↘️'
                const isTriggered = alert.status === 'triggered'
                const priceDiff = currentPrice - alert.targetPrice
                const priceDiffPercent =
                  alert.targetPrice > 0
                    ? (priceDiff / alert.targetPrice) * 100
                    : 0

                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: isTriggered ? '#fff3cd' : '#ffffff',
                      border: `2px solid ${
                        isTriggered ? '#ffa500' : '#e6e6e6'
                      }`,
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>
                          {this.getStatusIcon(alert.status)}
                        </span>
                        <div>
                          <h4
                            style={{
                              margin: '0',
                              color: '#333',
                              fontSize: '18px',
                              fontWeight: 'bold',
                            }}
                          >
                            {alert.coin.toUpperCase()} {priceDirection}
                          </h4>
                          <p
                            style={{
                              margin: '4px 0 0 0',
                              color: '#666',
                              fontSize: '14px',
                            }}
                          >
                            {alert.type === 'above' ? 'Above' : 'Below'}{' '}
                            {curSymbol}
                            {$numberWithCommas(alert.targetPrice.toFixed(2))}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '24px',
                          fontSize: '14px',
                        }}
                      >
                        <div>
                          <span style={{ color: '#666' }}>Current: </span>
                          <span
                            style={{
                              fontWeight: 'bold',
                              color:
                                currentPrice > alert.targetPrice
                                  ? '#21ce99'
                                  : '#d82d2d',
                            }}
                          >
                            {curSymbol}
                            {$numberWithCommas(currentPrice.toFixed(2))}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Difference: </span>
                          <span
                            style={{
                              fontWeight: 'bold',
                              color: priceDiff >= 0 ? '#21ce99' : '#d82d2d',
                            }}
                          >
                            {priceDiff >= 0 ? '+' : ''}
                            {curSymbol}
                            {$numberWithCommas(Math.abs(priceDiff).toFixed(2))}(
                            {priceDiff >= 0 ? '+' : ''}
                            {priceDiffPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#666' }}>Created: </span>
                          <span>{this.formatDate(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: this.getStatusColor(alert.status),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        {alert.status}
                      </div>

                      <button
                        onClick={() => this.props.onDeleteAlert(alert.id)}
                        style={{
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#d82d2d',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                        title="Delete Alert"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {this.props.alerts.length > 0 && (
          <div
            style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
            }}
          >
            <h3 style={{ color: '#333', marginBottom: '16px' }}>
              Alert Summary
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#21ce99',
                  }}
                >
                  {statusCounts.active}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Active Alerts
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#ffa500',
                  }}
                >
                  {statusCounts.triggered}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Triggered Today
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#333',
                  }}
                >
                  {new Set(this.props.alerts.map((a) => a.coin)).size}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Coins Monitored
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default AlertManager
