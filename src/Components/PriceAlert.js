'use client'

import { Component } from 'react'
import { translationStrings } from '../Utils/i18n'
import { $currencySymbol, $numberWithCommas } from '../Utils/Helpers'

class PriceAlert extends Component {
  constructor(props) {
    super(props)
    this.state = {
      alertType: 'above',
      targetPrice: '',
      showForm: false,
    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { targetPrice, alertType } = this.state
    const { coin } = this.props

    const targetNum = Number(targetPrice)
    if (!targetPrice || isNaN(targetNum)) {
      alert('Please enter a valid price')
      return
    }

    if (targetNum <= 0) {
      alert('Price must be greater than 0')
      return
    }

    // Validate alert makes sense
    if (alertType === 'above' && targetNum <= this.props.currentPrice) {
      const confirm = window.confirm(
        `You're setting an alert for ${coin.toUpperCase()} to go above ${targetNum}, but the current price is ${this.props.currentPrice.toFixed(
          2
        )}. Continue anyway?`
      )
      if (!confirm) return
    }

    if (alertType === 'below' && targetNum >= this.props.currentPrice) {
      const confirm = window.confirm(
        `You're setting an alert for ${coin.toUpperCase()} to go below ${targetNum}, but the current price is ${this.props.currentPrice.toFixed(
          2
        )}. Continue anyway?`
      )
      if (!confirm) return
    }

    const newAlert = {
      coin,
      type: alertType,
      targetPrice: targetNum,
    }

    this.props.onSaveAlert(newAlert)
    this.setState({ targetPrice: '', showForm: false })
  }

  toggleForm = () => {
    this.setState({ showForm: !this.state.showForm })
  }

  getSuggestedPrices = () => {
    const current = this.props.currentPrice
    return {
      above: [
        { label: '+5%', value: current * 1.05 },
        { label: '+10%', value: current * 1.1 },
        { label: '+25%', value: current * 1.25 },
        { label: '+50%', value: current * 1.5 },
      ],
      below: [
        { label: '-5%', value: current * 0.95 },
        { label: '-10%', value: current * 0.9 },
        { label: '-25%', value: current * 0.75 },
        { label: '-50%', value: current * 0.5 },
      ],
    }
  }

  render() {
    const { coin, currentPrice, currency, existingAlerts, onDeleteAlert } =
      this.props
    const { alertType, targetPrice, showForm } = this.state
    const string = translationStrings(this.props.language)
    const curSymbol = $currencySymbol(currency)

    const coinAlerts = existingAlerts.filter(
      (alert) => alert.coin === coin && alert.status === 'active'
    )

    const suggestedPrices = this.getSuggestedPrices()

    return (
      <div className="price-alert">
        <div
          className="alert-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ margin: '0', color: '#333' }}>Price Alerts</h3>
          <button
            onClick={this.toggleForm}
            style={{
              backgroundColor: showForm ? '#d82d2d' : '#21ce99',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s ease',
            }}
          >
            {showForm ? 'Cancel' : '+ Add Alert'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={this.handleSubmit}
            className="alert-form"
            style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                Alert Type:
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    value="above"
                    checked={alertType === 'above'}
                    onChange={(e) =>
                      this.setState({ alertType: e.target.value })
                    }
                    style={{ marginRight: '6px' }}
                  />
                  Above (↗️)
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    value="below"
                    checked={alertType === 'below'}
                    onChange={(e) =>
                      this.setState({ alertType: e.target.value })
                    }
                    style={{ marginRight: '6px' }}
                  />
                  Below (↘️)
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                Target Price ({currency}):
              </label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => this.setState({ targetPrice: e.target.value })}
                placeholder={`Current: ${curSymbol}${$numberWithCommas(
                  currentPrice.toFixed(2)
                )}`}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                }}
              />
            </div>

            {/* Quick Price Suggestions */}
            <div className="price-suggestions" style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                Quick Select:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {suggestedPrices[alertType].map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() =>
                      this.setState({
                        targetPrice: suggestion.value.toFixed(2),
                      })
                    }
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #21ce99',
                      backgroundColor: 'white',
                      color: '#21ce99',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {suggestion.label} ({curSymbol}
                    {$numberWithCommas(suggestion.value.toFixed(2))})
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#21ce99',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              Set Alert
            </button>
          </form>
        )}

        {coinAlerts.length > 0 && (
          <div className="active-alerts">
            <h4 style={{ color: '#333', marginBottom: '12px' }}>
              Active Alerts for {coin.toUpperCase()} ({coinAlerts.length})
            </h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {coinAlerts.map((alertItem) => {
                const isClose =
                  Math.abs(currentPrice - alertItem.targetPrice) /
                    alertItem.targetPrice <
                  0.05
                return (
                  <div
                    key={alertItem.id}
                    className="alert-item"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: isClose ? '#fff3cd' : '#ffffff',
                      border: `1px solid ${isClose ? '#ffa500' : '#e6e6e6'}`,
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>
                          {alertItem.type === 'above' ? '↗️' : '↘️'}
                        </span>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>
                            {curSymbol}
                            {$numberWithCommas(
                              alertItem.targetPrice.toFixed(2)
                            )}
                          </span>
                          <span
                            style={{
                              color: '#666',
                              marginLeft: '8px',
                              fontSize: '14px',
                            }}
                          >
                            ({alertItem.type === 'above' ? 'Above' : 'Below'})
                          </span>
                        </div>
                      </div>
                      {isClose && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#856404',
                            marginTop: '4px',
                            fontWeight: 'bold',
                          }}
                        >
                          🔥 Close to target!
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteAlert(alertItem.id)}
                      style={{
                        backgroundColor: '#d82d2d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                      title="Delete Alert"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default PriceAlert
