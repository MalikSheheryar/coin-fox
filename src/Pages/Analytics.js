import { Component } from 'react'
import { Link } from 'react-router-dom'
import PortfolioAnalytics from '../Components/PortfolioAnalytics'
import { translationStrings } from '../Utils/i18n'

class Analytics extends Component {
  render() {
    const home = this.props.blockstack ? '/blockstack' : '/'
    const string = translationStrings(this.props.language)

    return (
      <div className="Analytics">
        <div
          className="header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e6e6e6',
          }}
        >
          <Link className="menu" key="Menu" to="/menu">
            <i className="btn-menu fa fa-lg fa-bars" aria-hidden="true"></i>
          </Link>
          <h1 style={{ margin: '0', color: '#333' }}>Portfolio Analytics</h1>
          <Link className="coinClose" to={home}>
            <i className="btn-menu fa fa-lg fa-times" aria-hidden="true"></i>
          </Link>
        </div>

        <PortfolioAnalytics
          coinz={this.props.coinz}
          marketData={this.props.marketData}
          currency={this.props.currency}
          exchangeRate={this.props.exchangeRate}
          totalPortfolio={this.props.totalPortfolio}
          language={this.props.language}
        />
      </div>
    )
  }
}

export default Analytics
