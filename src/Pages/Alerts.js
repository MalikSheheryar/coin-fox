import { Component } from 'react'
import { Link } from 'react-router-dom'
import AlertManager from '../Components/AlertManager'
import { translationStrings } from '../Utils/i18n'

class Alerts extends Component {
  render() {
    const home = this.props.blockstack ? '/blockstack' : '/'
    const string = translationStrings(this.props.language)

    return (
      <div className="Alerts">
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
          <h1 style={{ margin: '0', color: '#333' }}>Price Alerts</h1>
          <Link className="coinClose" to={home}>
            <i className="btn-menu fa fa-lg fa-times" aria-hidden="true"></i>
          </Link>
        </div>

        <AlertManager
          alerts={this.props.alerts}
          marketData={this.props.marketData}
          currency={this.props.currency}
          exchangeRate={this.props.exchangeRate}
          language={this.props.language}
          onDeleteAlert={this.props.onDeleteAlert}
          onToggleAlert={this.props.onToggleAlert}
        />
      </div>
    )
  }
}

export default Alerts
