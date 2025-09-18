import { Component } from 'react'
import { Link } from 'react-router-dom'
import AddCoin from '../Components/AddCoin'
import CurrencyPref from '../Components/CurrencyPref'
import LanguagePref from '../Components/LanguagePref'
import ImportExport from '../Components/ImportExport'
import { translationStrings } from '../Utils/i18n'

class Menu extends Component {
  render() {
    const home = this.props.blockstack ? '/blockstack' : '/'
    const currency = this.props.pref.currency ? this.props.pref.currency : '...'
    const language = this.props.pref.language ? this.props.pref.language : null
    const string = translationStrings(this.props.language)

    return (
      <div className="theMenu">
        <Link className="menu" key="nav" to={home}>
          <i className="btn-menu fa fa-lg fa-times" aria-hidden="true"></i>
        </Link>
        <CurrencyPref
          supportedCurrencies={this.props.supportedCurrencies}
          saveNewPref={this.props.saveNewPref}
          language={language}
          currency={currency}
          key="CurrencyPref"
        />
        <LanguagePref
          saveNewPref={this.props.saveNewPref}
          language={language}
          key="LanguagePref"
        />

        <AddCoin
          language={language}
          addCoinz={this.props.addCoinz}
          key="AddCoin"
        />

        <ImportExport language={language} />

        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Link
            to="/analytics"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#21ce99',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              marginRight: '12px',
              marginBottom: '8px',
            }}
          >
            📊 Portfolio Analytics
          </Link>
          <Link
            to="/alerts"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#ffa500',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            🔔 Manage Alerts
          </Link>
        </div>

        <div>
          <hr />
          <p className="center">
            <b>
              Leverage your hodlings with a{' '}
              <a href="https://rocko.co">
                <i>crypto backed loan</i>
              </a>{' '}
              through Rocko DeFi!
            </b>
          </p>
        </div>

        <div>
          <hr />
          <p className="center">
            <a href="https://github.com/vinniejames/coinfox">
              {string.learnmore}
            </a>{' '}
            or&nbsp;
            <a href="https://github.com/vinniejames/coinfox/issues">
              {string.givefeedback}
            </a>
          </p>
        </div>
      </div>
    )
  }
}

export default Menu
