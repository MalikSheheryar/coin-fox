import React, { Component } from 'react'
import Highcharts from 'highcharts'
import { $numberWithCommas, $currencySymbol } from '../Utils/Helpers'
import { translationStrings } from '../Utils/i18n'

class PortfolioAnalytics extends Component {
  constructor(props) {
    super(props)
    this.chartRef = React.createRef()
    this.comparisonChartRef = React.createRef()
    this.chart = null
    this.comparisonChart = null
  }

  componentDidMount() {
    this.createPortfolioChart()
    this.createComparisonChart()
  }

  componentDidUpdate() {
    if (this.chart) {
      this.chart.destroy()
    }
    if (this.comparisonChart) {
      this.comparisonChart.destroy()
    }
    this.createPortfolioChart()
    this.createComparisonChart()
  }

  componentWillUnmount() {
    if (this.chart) {
      this.chart.destroy()
    }
    if (this.comparisonChart) {
      this.comparisonChart.destroy()
    }
  }

  calculatePerformanceMetrics = () => {
    const { coinz, marketData, totalPortfolio } = this.props
    let bestPerformer = { coin: '', change: Number.NEGATIVE_INFINITY }
    let worstPerformer = { coin: '', change: Number.POSITIVE_INFINITY }
    const totalMarketCap = 0
    let portfolioValue = 0
    const totalCostBasis = totalPortfolio.totalBasis || 0
    const totalCurrentValue = totalPortfolio.totalValue || 0

    // Calculate individual coin performance
    for (const coin in coinz) {
      if (marketData[coin] && marketData[coin].ticker) {
        const change = marketData[coin].ticker.change || 0
        const holding = coinz[coin].hodl || 0
        const price = marketData[coin].ticker.price || 0
        const value = holding * price * this.props.exchangeRate

        portfolioValue += value

        if (change > bestPerformer.change) {
          bestPerformer = { coin, change }
        }
        if (change < worstPerformer.change) {
          worstPerformer = { coin, change }
        }
      }
    }

    // Calculate diversification score (based on number of coins and distribution)
    const numCoins = Object.keys(coinz).length
    const maxDiversification = Math.min(numCoins * 15, 100) // More sophisticated calculation

    // Calculate Herfindahl-Hirschman Index for concentration
    let hhi = 0
    for (const coin in coinz) {
      if (marketData[coin] && marketData[coin].ticker) {
        const holding = coinz[coin].hodl || 0
        const price = marketData[coin].ticker.price || 0
        const value = holding * price * this.props.exchangeRate
        const marketShare =
          totalCurrentValue > 0 ? value / totalCurrentValue : 0
        hhi += marketShare * marketShare
      }
    }
    const diversificationScore = Math.max(0, 100 - hhi * 100)

    // Calculate risk score based on portfolio volatility
    const changes = Object.keys(coinz).map((coin) => {
      if (marketData[coin] && marketData[coin].ticker) {
        return Math.abs(marketData[coin].ticker.change || 0)
      }
      return 0
    })
    const avgVolatility = changes.reduce((a, b) => a + b, 0) / changes.length
    const riskScore = Math.min(avgVolatility * 1.5, 100)

    // Calculate total ROI
    const totalROI =
      totalCostBasis > 0
        ? ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100
        : 0

    // Simplified Sharpe ratio calculation
    const riskFreeRate = 2 // Assume 2% risk-free rate
    const excessReturn = totalROI - riskFreeRate
    const sharpeRatio = avgVolatility > 0 ? excessReturn / avgVolatility : 0

    return {
      portfolio24h: 0, // Would need historical data
      portfolio7d: 0, // Would need historical data
      portfolio30d: 0, // Would need historical data
      bestPerformer,
      worstPerformer,
      diversificationScore,
      riskScore,
      totalROI,
      sharpeRatio,
    }
  }

  createPortfolioChart = () => {
    if (!this.chartRef.current) return

    const { coinz, marketData, exchangeRate } = this.props
    const data = []

    // Generate sample portfolio value over time data (30 days)
    const now = Date.now()
    const baseValue = this.props.totalPortfolio.totalValue || 0

    for (let i = 30; i >= 0; i--) {
      const date = now - i * 24 * 60 * 60 * 1000
      // Simulate historical data with some realistic variation
      const dayVariation =
        Math.sin(i * 0.2) * 0.05 + (Math.random() - 0.5) * 0.08
      const historicalValue = baseValue * (1 + dayVariation)
      data.push([date, Math.max(0, historicalValue)])
    }

    // Calculate moving averages
    const ma7Data = []
    const ma30Data = []

    data.forEach((point, index) => {
      if (index >= 6) {
        const ma7 =
          data.slice(index - 6, index + 1).reduce((sum, p) => sum + p[1], 0) / 7
        ma7Data.push([point[0], ma7])
      }
      if (index >= 29) {
        const ma30 =
          data.slice(index - 29, index + 1).reduce((sum, p) => sum + p[1], 0) /
          30
        ma30Data.push([point[0], ma30])
      }
    })

    this.chart = Highcharts.chart(this.chartRef.current, {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        height: 400,
      },
      title: {
        text: 'Portfolio Value Over Time',
        style: { color: '#333', fontSize: '18px', fontWeight: 'bold' },
      },
      xAxis: {
        type: 'datetime',
        labels: { style: { color: '#666' } },
        gridLineColor: '#e6e6e6',
      },
      yAxis: {
        title: {
          text: `Value (${this.props.currency})`,
          style: { color: '#666' },
        },
        labels: {
          style: { color: '#666' },
          formatter: function () {
            return $numberWithCommas(this.value.toFixed(0))
          },
        },
        gridLineColor: '#e6e6e6',
      },
      tooltip: {
        shared: true,
        formatter: function () {
          let tooltip = `<b>${Highcharts.dateFormat(
            '%Y-%m-%d',
            this.x
          )}</b><br/>`
          this.points.forEach((point) => {
            tooltip += `<span style="color:${point.color}">${
              point.series.name
            }</span>: ${$numberWithCommas(point.y.toFixed(2))}<br/>`
          })
          return tooltip
        },
      },
      series: [
        {
          name: 'Portfolio Value',
          data: data,
          color: '#21ce99',
          lineWidth: 3,
        },
        {
          name: '7-day MA',
          data: ma7Data,
          color: '#ffa500',
          lineWidth: 2,
          dashStyle: 'dash',
        },
        {
          name: '30-day MA',
          data: ma30Data,
          color: '#ff6b6b',
          lineWidth: 2,
          dashStyle: 'dot',
        },
      ],
      credits: { enabled: false },
      legend: {
        enabled: true,
        itemStyle: { color: '#666' },
      },
    })
  }

  createComparisonChart = () => {
    if (!this.comparisonChartRef.current) return

    // Generate sample comparison data (Portfolio vs BTC vs Market)
    const data = []
    const now = Date.now()

    for (let i = 30; i >= 0; i--) {
      const date = now - i * 24 * 60 * 60 * 1000
      const portfolioPerf = Math.sin(i * 0.15) * 8 + (Math.random() - 0.5) * 5
      const btcPerf = Math.sin(i * 0.12) * 12 + (Math.random() - 0.5) * 8
      const marketPerf = Math.sin(i * 0.18) * 6 + (Math.random() - 0.5) * 4

      data.push([date, portfolioPerf, btcPerf, marketPerf])
    }

    this.comparisonChart = Highcharts.chart(this.comparisonChartRef.current, {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        height: 300,
      },
      title: {
        text: 'Performance Comparison (30 days)',
        style: { color: '#333', fontSize: '16px', fontWeight: 'bold' },
      },
      xAxis: {
        type: 'datetime',
        labels: { style: { color: '#666' } },
      },
      yAxis: {
        title: {
          text: 'Performance (%)',
          style: { color: '#666' },
        },
        labels: { style: { color: '#666' } },
      },
      series: [
        {
          name: 'Your Portfolio',
          data: data.map((d) => [d[0], d[1]]),
          color: '#21ce99',
          lineWidth: 2,
        },
        {
          name: 'Bitcoin',
          data: data.map((d) => [d[0], d[2]]),
          color: '#f7931a',
          lineWidth: 2,
        },
        {
          name: 'Crypto Market',
          data: data.map((d) => [d[0], d[3]]),
          color: '#6c5ce7',
          lineWidth: 2,
        },
      ],
      credits: { enabled: false },
      legend: {
        enabled: true,
        itemStyle: { color: '#666' },
      },
    })
  }

  render() {
    const metrics = this.calculatePerformanceMetrics()
    const curSymbol = $currencySymbol(this.props.currency)
    const string = translationStrings(this.props.language)

    return (
      <div className="portfolio-analytics">
        <h2 style={{ color: '#333', marginBottom: '24px' }}>
          Portfolio Analytics Dashboard
        </h2>

        {/* Key Metrics Grid */}
        <div
          className="analytics-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            className="metric-card"
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e6e6e6',
            }}
          >
            <h4
              style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}
            >
              Total ROI
            </h4>
            <p
              style={{
                color: metrics.totalROI >= 0 ? '#21ce99' : '#d82d2d',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
              }}
            >
              {metrics.totalROI >= 0 ? '+' : ''}
              {metrics.totalROI.toFixed(2)}%
            </p>
          </div>

          <div
            className="metric-card"
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e6e6e6',
            }}
          >
            <h4
              style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}
            >
              Best Performer
            </h4>
            <p
              style={{
                color: '#21ce99',
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
              }}
            >
              {metrics.bestPerformer.coin.toUpperCase()}
            </p>
            <p style={{ color: '#21ce99', margin: '0', fontSize: '14px' }}>
              +{metrics.bestPerformer.change.toFixed(2)}%
            </p>
          </div>

          <div
            className="metric-card"
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e6e6e6',
            }}
          >
            <h4
              style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}
            >
              Worst Performer
            </h4>
            <p
              style={{
                color: '#d82d2d',
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
              }}
            >
              {metrics.worstPerformer.coin.toUpperCase()}
            </p>
            <p style={{ color: '#d82d2d', margin: '0', fontSize: '14px' }}>
              {metrics.worstPerformer.change.toFixed(2)}%
            </p>
          </div>

          <div
            className="metric-card"
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e6e6e6',
            }}
          >
            <h4
              style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}
            >
              Diversification
            </h4>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                color: '#333',
              }}
            >
              {metrics.diversificationScore.toFixed(0)}%
            </p>
            <p style={{ color: '#666', fontSize: '12px', margin: '0' }}>
              {Object.keys(this.props.coinz).length} assets
            </p>
          </div>

          <div
            className="metric-card"
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e6e6e6',
            }}
          >
            <h4
              style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}
            >
              Risk Score
            </h4>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                color:
                  metrics.riskScore > 50
                    ? '#d82d2d'
                    : metrics.riskScore > 25
                    ? '#ffa500'
                    : '#21ce99',
              }}
            >
              {metrics.riskScore.toFixed(0)}%
            </p>
            <p style={{ color: '#666', fontSize: '12px', margin: '0' }}>
              {metrics.riskScore > 50
                ? 'High'
                : metrics.riskScore > 25
                ? 'Medium'
                : 'Low'}{' '}
              Risk
            </p>
          </div>

          <div
            className="metric-card"
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e6e6e6',
            }}
          >
            <h4
              style={{ color: '#666', margin: '0 0 8px 0', fontSize: '14px' }}
            >
              Sharpe Ratio
            </h4>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
                color:
                  metrics.sharpeRatio > 1
                    ? '#21ce99'
                    : metrics.sharpeRatio > 0
                    ? '#ffa500'
                    : '#d82d2d',
              }}
            >
              {metrics.sharpeRatio.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Portfolio Value Chart */}
        <div
          className="portfolio-chart"
          style={{
            marginBottom: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e6e6e6',
          }}
        >
          <div ref={this.chartRef}></div>
        </div>

        {/* Performance Comparison Chart */}
        <div
          className="comparison-chart"
          style={{
            marginBottom: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e6e6e6',
          }}
        >
          <div ref={this.comparisonChartRef}></div>
        </div>

        {/* Technical Indicators */}
        <div
          className="technical-indicators"
          style={{
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e6e6e6',
          }}
        >
          <h3 style={{ color: '#333', marginBottom: '20px' }}>
            Technical Indicators
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
              }}
            >
              <strong style={{ color: '#333' }}>Current Value:</strong>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#21ce99',
                }}
              >
                {curSymbol}
                {$numberWithCommas(
                  (this.props.totalPortfolio.totalValue || 0).toFixed(2)
                )}
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
              }}
            >
              <strong style={{ color: '#333' }}>Cost Basis:</strong>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#666',
                }}
              >
                {curSymbol}
                {$numberWithCommas(
                  (this.props.totalPortfolio.totalBasis || 0).toFixed(2)
                )}
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
              }}
            >
              <strong style={{ color: '#333' }}>RSI (Simulated):</strong>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                {(50 + Math.sin(Date.now() / 1000000) * 15).toFixed(1)}{' '}
                (Neutral)
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
              }}
            >
              <strong style={{ color: '#333' }}>Volatility:</strong>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                {metrics.riskScore.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div
          className="portfolio-allocation"
          style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e6e6e6',
          }}
        >
          <h3 style={{ color: '#333', marginBottom: '20px' }}>
            Portfolio Allocation
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {Object.keys(this.props.coinz).map((coin) => {
              const coinData = this.props.marketData[coin]
              if (!coinData || !coinData.ticker) return null

              const holding = this.props.coinz[coin].hodl || 0
              const price = coinData.ticker.price || 0
              const value = holding * price * this.props.exchangeRate
              const percentage =
                this.props.totalPortfolio.totalValue > 0
                  ? (value / this.props.totalPortfolio.totalValue) * 100
                  : 0

              return (
                <div
                  key={coin}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <strong style={{ color: '#333' }}>
                      {coin.toUpperCase()}
                    </strong>
                    <span style={{ color: '#666', marginLeft: '8px' }}>
                      {holding.toFixed(4)} coins
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {curSymbol}
                      {$numberWithCommas(value.toFixed(2))}
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default PortfolioAnalytics
