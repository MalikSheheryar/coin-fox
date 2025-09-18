import { Component } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import { isUserSignedIn, putFile, getFile } from 'blockstack'

import fetch from 'fetch-retry'

import Home from './Pages/Home'
import Coin from './Pages/Coin'
import Pie from './Pages/Pie'
import Menu from './Pages/Menu'
import SupportedCoins from './Pages/SupportedCoins'
import Analytics from './Pages/Analytics'
import Alerts from './Pages/Alerts'

import './App.css'
import Blockstack from './Components/Blockstack'
import NotificationSystem from './Components/Notifications'
import AlertNotification from './Components/AlertNotification'
import RealTimeStatus from './Components/RealTimeStatus'

import { translationStrings } from './Utils/i18n'
import {
  generateAlertId,
  checkAlertTriggers,
  saveAlertsToStorage,
  loadAlertsFromStorage,
} from './Utils/alertHelpers'
import { Buffer } from 'buffer'
window.Buffer = Buffer
const string = translationStrings()

const supportedCurrencies = [
  ['AUD', '$'],
  ['BGN', 'лв'],
  ['BRL', 'R$'],
  // ['BTC', '฿'],
  ['CAD', '$'],
  ['CHF', 'Fr.'],
  ['CNY', '¥'],
  ['CZK', 'Kč'],
  ['DKK', 'kr'],
  ['EUR', '€'],
  ['GBP', '£'],
  ['HKD', '$'],
  ['HRK', 'kn'],
  ['HUF', 'Ft'],
  ['IDR', 'Rp'],
  ['ILS', '₪'],
  ['INR', '₹'],
  ['JPY', '¥'],
  ['KRW', '₩'],
  ['MXN', '$'],
  ['MYR', 'RM'],
  ['NOK', 'kr'],
  ['NZD', '$'],
  ['PHP', '₱'],
  ['PLN', 'zł'],
  ['RON', 'lei'],
  // ['RUR', '₽'],
  ['SEK', 'kr'],
  ['SGD', '$'],
  ['THB', '฿'],
  ['TRY', '₺'],
  // ['UAH', '₴'],
  ['USD', '$'],
  ['ZAR', 'R'],
]

class App extends Component {
  constructor() {
    super()

    this.state = {
      coinz: {},
      pref: {},
      marketData: false, // no data yet
      exchangeRates: { USD: 1 }, // defaults to 1 for US Dollar
      blockstack: isUserSignedIn(), //returns true if user is logged in
      gaiaStorage: 'coinfox.json',
      supportedCurrencies: supportedCurrencies,
      priceAlerts: [],
      triggeredAlerts: [],
      isConnected: true,
      lastUpdate: Date.now(),
      nextUpdate: Date.now() + 60000,
      updateInterval: 60000, // 1 minute default
      retryCount: 0,
      maxRetries: 3,
    }
  }

  addExistingCoin(storage, key, payload) {
    // if user had coin, add more
    const existingPriceAvg = storage.coinz[key].cost_basis
    const existingHodl = storage.coinz[key].hodl

    const addPriceAvg = payload.cost_basis
    const addHodl = payload.hodl

    const newHodl = addHodl + existingHodl
    const newTotalValue =
      addPriceAvg * addHodl + existingPriceAvg * existingHodl

    const newPriceAvg = newTotalValue / newHodl

    storage.coinz[key] = {
      cost_basis: newPriceAvg,
      hodl: newHodl,
    }

    return storage.coinz
  }

  saveCoinToStorage = (key, payload) => {
    const storage = this.readLocalStorage()
    if (storage.coinz[key]) {
      const newCoinz = this.addExistingCoin(storage, key, payload)

      localStorage.setItem('coinz', JSON.stringify(newCoinz))
      this.setState({ coinz: newCoinz })
    } else {
      // must be a new coin
      storage.coinz[key] = payload
      const newCoinz = storage.coinz

      localStorage.setItem('coinz', JSON.stringify(newCoinz))
      // must re-fetch market data if new coin
      this.marketData(newCoinz)
      this.setState({ coinz: newCoinz })
    }
  }

  saveCoinToGaia = (key, payload) => {
    const decrypt = true
    getFile(this.state.gaiaStorage, decrypt)
      .then((gaia) => {
        const jsonGaia = JSON.parse(gaia)
        const gaiaCoinz = (jsonGaia.coinz && jsonGaia.coinz) || {}
        const gaiaPref = (jsonGaia.pref && jsonGaia.pref) || { currency: 'USD' }
        const userData = {
          coinz: gaiaCoinz,
          pref: gaiaPref,
        }
        return userData
      })
      .then((storage) => {
        console.log(storage.coinz, storage.pref, 'for gaia to save')
        const encrypt = true

        if (storage.coinz[key]) {
          const newCoinz = this.addExistingCoin(storage, key, payload)
          const data = {
            coinz: newCoinz,
            pref: storage.pref,
          }

          putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
            .then(() => {
              this.marketData(newCoinz)
            })
            .then(() => {
              this.setState({
                coinz: newCoinz,
                pref: storage.pref,
              })
            })
            .catch((ex) => {
              console.log(ex, 'Gaia put exception')
            })
        } else {
          storage.coinz[key] = payload
          const newCoinz = storage.coinz
          const data = {
            coinz: newCoinz,
            pref: storage.pref,
          }

          putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
            .then(() => {
              this.marketData(newCoinz)
            })
            .then(() => {
              this.setState({
                coinz: newCoinz,
                pref: storage.pref,
              })
            })
            .catch((ex) => {
              console.log(ex, 'Gaia put exception')
            })
        }
      })
  }

  addCoinz = (coin) => {
    const ticker = coin.ticker
    const costBasis = coin.avg_cost
    const hodl = coin.hodl

    if (!ticker || !costBasis || !hodl) {
      alert(string.fillticker)
    } else {
      const payload = {
        cost_basis: costBasis,
        hodl: hodl,
      }
      if (isUserSignedIn()) {
        this.saveCoinToGaia(ticker, payload)
      } else {
        this.saveCoinToStorage(ticker, payload)
      }
      alert(ticker.toUpperCase() + string.added)
    }
  }

  fetchThen = (endpoint) => {
    const promise = new Promise((resolve, reject) => {
      const handleFetchErr = (res) => {
        if (!res.ok) {
          throw Error(res.statusText)
        }
        return res
      }

      const retryFetch = {
        retries: 3,
        retryDelay: 1000,
      }

      fetch(endpoint, retryFetch)
        .then(handleFetchErr)
        .then((res) => {
          return res.json()
        })
        .then((res) => {
          resolve(res)
        })
        .catch((e) => {
          console.log(e)
          reject()
        })
    })

    return promise
  }

  marketData = async (userCoinz) => {
    try {
      this.setState({
        isConnected: true,
        lastUpdate: Date.now(),
        nextUpdate: Date.now() + this.state.updateInterval,
        retryCount: 0,
      })

      if (!userCoinz || Object.keys(userCoinz).length === 0) {
        this.setState({ marketData: {} })
        return
      }

      const marketData = {}
      const userTickers = Object.keys(userCoinz)

      // Fetch full list to map symbol -> id
      let usersCoinList = []
      try {
        const listRes = await fetch(
          'https://api.coingecko.com/api/v3/coins/list'
        )
        if (!listRes.ok) throw new Error(`Coins list HTTP ${listRes.status}`)
        const allCoins = await listRes.json()
        usersCoinList = allCoins.filter((coin) =>
          userTickers.includes(coin.symbol)
        )
      } catch (e) {
        console.warn('Failed to fetch coins list', e)
        this.handleConnectionError()
        return
      }

      const usersCoinIds = usersCoinList.map((coin) => coin.id)
      if (usersCoinIds.length === 0) {
        this.setState({ marketData: {} })
        return
      }

      const currency = 'usd'
      let usersMarketData = {}
      try {
        const priceRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${usersCoinIds.join(
            '%2C'
          )}&vs_currencies=${currency}&include_24hr_vol=true&include_24hr_change=true`
        )
        if (!priceRes.ok) throw new Error(`Price HTTP ${priceRes.status}`)
        usersMarketData = await priceRes.json()
      } catch (e) {
        console.warn('Failed to fetch price data', e)
        this.handleConnectionError()
        return
      }

      userTickers.forEach((t) => {
        try {
          const meta = usersCoinList.find((c) => c.symbol === t)
          if (!meta) return
          const dataForId = usersMarketData[meta.id]
          if (!dataForId) return
          marketData[t] = {
            ticker: {
              base: t.toUpperCase(),
              target: currency.toUpperCase(),
              price: dataForId[currency],
              volume: dataForId.usd_24h_vol,
              change: dataForId.usd_24h_change,
            },
            timestamp: Math.floor(new Date().getTime() / 100),
            success: true,
            error: '',
          }
        } catch (e) {
          console.log(e, `ticker not found in market data: ${t}`)
        }
      })
      this.setState({ marketData })
      setTimeout(() => this.checkPriceAlerts(), 1000)
    } catch (e) {
      console.warn('marketData error', e)
      this.handleConnectionError()
    }
  }

  handleConnectionError = () => {
    const newRetryCount = this.state.retryCount + 1
    const newUpdateInterval = Math.min(this.state.updateInterval * 1.5, 300000) // Max 5 minutes

    this.setState({
      isConnected: false,
      retryCount: newRetryCount,
      updateInterval: newUpdateInterval,
      nextUpdate: Date.now() + newUpdateInterval,
    })

    if (newRetryCount >= this.state.maxRetries) {
      console.warn('Max retries reached, switching to longer update interval')
    }
  }

  readLocalStorage() {
    const userCoinData = localStorage.coinz
      ? JSON.parse(localStorage.coinz)
      : {}
    const userPref = localStorage.pref
      ? JSON.parse(localStorage.pref)
      : { currency: 'USD' }

    return { coinz: userCoinData, pref: userPref }
  }

  fetchExchangeRates = () => {
    //TODO replace with CoinGecko local currency pricing
  }

  totalPortfolio = (exchangeRate) => {
    const coinz = this.state.coinz ? this.state.coinz : false
    const marketData = this.state.marketData ? this.state.marketData : false

    let totalValue = 0
    let totalBasis = 0

    for (const coin in coinz) {
      const costBasis = coinz[coin].cost_basis
      const hodl = coinz[coin].hodl
      const basisForCoin = costBasis * hodl

      if (marketData[coin]) {
        const price =
          marketData[coin] &&
          marketData[coin].ticker &&
          marketData[coin].ticker.price
            ? Number(marketData[coin].ticker.price)
            : 0
        const coinPrice = price * exchangeRate
        const valueForCoin = coinPrice * hodl

        totalValue = totalValue + valueForCoin
      }
      totalBasis = totalBasis + basisForCoin
    }

    return {
      totalValue: totalValue,
      totalBasis: totalBasis,
    }
  }

  redirectToHttps = () => {
    const userHasCoins = Boolean(localStorage.coinz)
    const https = window.location.protocol == 'https:'
    if (localStorage.https === 'true' || (!userHasCoins && !https)) {
      window.location.protocol = 'https:'
    } else if (userHasCoins && !https) {
      console.log('redirect to https with coin string')
      const base64 = btoa(JSON.stringify(localStorage))
      localStorage.setItem('https', 'true')
      window.location.href = 'https://coinfox.co?import=' + base64
    }
  }

  componentDidMount() {
    if (!window.location.origin.includes('localhost')) {
      this.redirectToHttps()
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const savedAlerts = loadAlertsFromStorage(this.state.blockstack)
    this.setState({ priceAlerts: savedAlerts })

    if (isUserSignedIn() && window.location.pathname == '/blockstack') {
      const decrypt = true
      getFile(this.state.gaiaStorage, decrypt)
        .then((gaia) => {
          console.log('gimme gaia', gaia)

          const jsonGaia = JSON.parse(gaia)
          const gaiaCoinz = (jsonGaia.coinz && jsonGaia.coinz) || {}
          const gaiaPref = (jsonGaia.pref && jsonGaia.pref) || {
            currency: 'USD',
          }
          const userData = {
            coinz: gaiaCoinz,
            pref: gaiaPref,
          }
          return userData
        })
        .then((userData) => {
          this.setState(userData)
        })
        .then(() => {
          this.marketData(this.state.coinz)
        })
        .then(() => {
          this.fetchExchangeRates()
        })
        .catch((ex) => {
          console.log(ex, 'Gaia get exception')

          const encrypt = true
          const data = {
            coinz: this.state.coinz,
            pref: { currency: 'USD' },
          }
          putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
            .then(() => {
              window.location.reload()
            })
            .catch((ex) => {
              console.log(ex, 'Gaia put exception')
            })
        })
    } else {
      const storage = this.readLocalStorage()
      this.marketData(storage.coinz)
      this.setState({
        coinz: storage.coinz,
        pref: storage.pref,
      })
      this.fetchExchangeRates()
    }

    this.alertCheckInterval = setInterval(() => {
      if (this.state.marketData && Object.keys(this.state.coinz).length > 0) {
        this.marketData(this.state.coinz)
      }
    }, this.state.updateInterval)

    this.statusUpdateInterval = setInterval(() => {
      this.setState({ nextUpdate: this.state.nextUpdate })
    }, 1000)
  }

  componentWillUnmount() {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval)
    }
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.priceAlerts.length !== this.state.priceAlerts.length) {
      const activeAlerts = this.state.priceAlerts.filter(
        (alert) => alert.status === 'active'
      ).length
      let newInterval = 60000 // Default 1 minute

      if (activeAlerts > 10) {
        newInterval = 30000 // 30 seconds for many alerts
      } else if (activeAlerts > 5) {
        newInterval = 45000 // 45 seconds for moderate alerts
      }

      if (newInterval !== this.state.updateInterval) {
        this.setState({ updateInterval: newInterval })

        if (this.alertCheckInterval) {
          clearInterval(this.alertCheckInterval)
        }

        this.alertCheckInterval = setInterval(() => {
          if (
            this.state.marketData &&
            Object.keys(this.state.coinz).length > 0
          ) {
            this.marketData(this.state.coinz)
          }
        }, newInterval)
      }
    }
  }

  addPriceAlert = (alertData) => {
    const newAlert = {
      ...alertData,
      id: generateAlertId(),
      status: 'active',
      createdAt: Date.now(),
    }

    const updatedAlerts = [...this.state.priceAlerts, newAlert]
    this.setState({ priceAlerts: updatedAlerts })
    saveAlertsToStorage(updatedAlerts, this.state.blockstack)
  }

  deletePriceAlert = (alertId) => {
    const updatedAlerts = this.state.priceAlerts.filter(
      (alert) => alert.id !== alertId
    )
    this.setState({ priceAlerts: updatedAlerts })
    saveAlertsToStorage(updatedAlerts, this.state.blockstack)
  }

  dismissTriggeredAlert = (alertId) => {
    const updatedTriggeredAlerts = this.state.triggeredAlerts.filter(
      (alert) => alert.id !== alertId
    )
    const updatedAlerts = this.state.priceAlerts.map((alert) =>
      alert.id === alertId ? { ...alert, status: 'dismissed' } : alert
    )

    this.setState({
      triggeredAlerts: updatedTriggeredAlerts,
      priceAlerts: updatedAlerts,
    })
    saveAlertsToStorage(updatedAlerts, this.state.blockstack)
  }

  togglePriceAlert = (alertId) => {
    const updatedAlerts = this.state.priceAlerts.map((alert) =>
      alert.id === alertId
        ? {
            ...alert,
            status: alert.status === 'active' ? 'inactive' : 'active',
          }
        : alert
    )

    this.setState({ priceAlerts: updatedAlerts })
    saveAlertsToStorage(updatedAlerts, this.state.blockstack)
  }

  checkPriceAlerts = () => {
    if (!this.state.marketData || this.state.priceAlerts.length === 0) return

    const triggeredAlerts = checkAlertTriggers(
      this.state.priceAlerts,
      this.state.marketData,
      this.state.exchangeRates[this.state.pref.currency] || 1
    )

    if (triggeredAlerts.length > 0) {
      const notificationAlerts = triggeredAlerts.map((alert) => ({
        ...alert,
        currentPrice:
          this.state.marketData[alert.coin].ticker.price *
          (this.state.exchangeRates[this.state.pref.currency] || 1),
        currency: this.state.pref.currency || 'USD',
      }))

      this.setState({ triggeredAlerts: notificationAlerts })

      const updatedAlerts = this.state.priceAlerts.map((alert) => {
        const triggered = triggeredAlerts.find((t) => t.id === alert.id)
        return triggered ? { ...alert, status: 'triggered' } : alert
      })

      this.setState({ priceAlerts: updatedAlerts })
      saveAlertsToStorage(updatedAlerts, this.state.blockstack)
    }
  }

  render() {
    const exchangeRate = this.state.exchangeRates[this.state.pref.currency]
      ? this.state.exchangeRates[this.state.pref.currency]
      : 1 // default 1 for USD

    const totalPortfolio = this.totalPortfolio(exchangeRate)
    const activeAlertCount = this.state.priceAlerts.filter(
      (alert) => alert.status === 'active'
    ).length

    return (
      <BrowserRouter>
        <div>
          <NotificationSystem />
          <AlertNotification
            alerts={this.state.triggeredAlerts}
            onDismiss={this.dismissTriggeredAlert}
          />
          <RealTimeStatus
            isConnected={this.state.isConnected}
            lastUpdate={this.state.lastUpdate}
            nextUpdate={this.state.nextUpdate}
            alertCount={activeAlertCount}
          />
          <Switch>
            <Route
              exact
              path="/"
              render={(props) => (
                <Home
                  {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  supportedCurrencies={this.state.supportedCurrencies}
                  totalPortfolio={totalPortfolio}
                  currency={
                    (this.state.pref && this.state.pref.currency) || 'USD'
                  }
                  language={
                    (this.state.pref && this.state.pref.language) || 'EN'
                  }
                  addCoinz={this.addCoinz}
                  saveNewPref={this.saveNewPref}
                />
              )}
            />

            <Route
              exact
              path="/blockstack"
              render={(props) => (
                <Blockstack
                  {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  supportedCurrencies={this.state.supportedCurrencies}
                  currency={
                    (this.state.pref && this.state.pref.currency) || 'USD'
                  }
                  language={
                    (this.state.pref && this.state.pref.language) || 'EN'
                  }
                  addCoinz={this.addCoinz}
                  saveNewPref={this.saveNewPref}
                />
              )}
            />

            <Route
              path="/coin/*"
              render={(props) => (
                <Coin
                  {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  blockstack={this.state.blockstack}
                  exchangeRate={exchangeRate}
                  deleteCoin={this.deleteCoin}
                  currency={
                    (this.state.pref && this.state.pref.currency) || 'USD'
                  }
                  language={
                    (this.state.pref && this.state.pref.language) || 'EN'
                  }
                  priceAlerts={this.state.priceAlerts}
                  onAddAlert={this.addPriceAlert}
                  onDeleteAlert={this.deletePriceAlert}
                />
              )}
            />

            <Route
              path="/pie"
              render={(props) => (
                <Pie
                  {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  totalPortfolio={totalPortfolio}
                  language={
                    (this.state.pref && this.state.pref.language) || 'EN'
                  }
                />
              )}
            />

            <Route
              path="/analytics"
              render={(props) => (
                <Analytics
                  {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  totalPortfolio={totalPortfolio}
                  currency={
                    (this.state.pref && this.state.pref.currency) || 'USD'
                  }
                  language={
                    (this.state.pref && this.state.pref.language) || 'EN'
                  }
                  blockstack={this.state.blockstack}
                />
              )}
            />

            <Route
              path="/menu"
              render={(props) => (
                <Menu
                  {...props}
                  addCoinz={this.addCoinz}
                  blockstack={this.state.blockstack}
                  pref={this.state.pref}
                  saveNewPref={this.saveNewPref}
                  supportedCurrencies={this.state.supportedCurrencies}
                  currency={
                    (this.state.pref && this.state.pref.currency) || 'USD'
                  }
                  language={
                    (this.state.pref && this.state.pref.language) || 'EN'
                  }
                />
              )}
            />

            <Route path="/supportedcoins" component={SupportedCoins} />

            <Route
              path="/alerts"
              render={(props) => (
                <Alerts
                  {...props}
                  alerts={this.state.priceAlerts}
                  marketData={this.state.marketData}
                  currency={
                    (this.state.pref && this.state.pref.currency) || 'USD'
                  }
                  exchangeRate={exchangeRate}
                  language={
                    (this.state.pref && this.state.pref.language) || 'EN'
                  }
                  blockstack={this.state.blockstack}
                  onDeleteAlert={this.deletePriceAlert}
                  onToggleAlert={this.togglePriceAlert}
                />
              )}
            />
          </Switch>
        </div>
      </BrowserRouter>
    )
  }
}

export default App
