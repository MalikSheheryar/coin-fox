export const generateAlertId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

export const checkAlertTriggers = (alerts, marketData, exchangeRate) => {
  const triggeredAlerts = []

  alerts.forEach((alert) => {
    if (alert.status !== 'active') return

    const coinData = marketData[alert.coin]
    if (!coinData || !coinData.ticker) return

    const currentPrice = coinData.ticker.price * exchangeRate

    const shouldTrigger =
      (alert.type === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.type === 'below' && currentPrice <= alert.targetPrice)

    if (shouldTrigger) {
      triggeredAlerts.push({
        ...alert,
        status: 'triggered',
      })
    }
  })

  return triggeredAlerts
}

export const saveAlertsToStorage = (alerts, isBlockstack) => {
  if (isBlockstack) {
    // Would integrate with Blockstack storage
    // For now, use localStorage as fallback
    localStorage.setItem('priceAlerts', JSON.stringify(alerts))
  } else {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts))
  }
}

export const loadAlertsFromStorage = (isBlockstack) => {
  try {
    if (isBlockstack) {
      // Would integrate with Blockstack storage
      // For now, use localStorage as fallback
      const stored = localStorage.getItem('priceAlerts')
      return stored ? JSON.parse(stored) : []
    } else {
      const stored = localStorage.getItem('priceAlerts')
      return stored ? JSON.parse(stored) : []
    }
  } catch (error) {
    console.error('Error loading alerts from storage:', error)
    return []
  }
}

export const getAlertStats = (alerts) => {
  const stats = {
    total: alerts.length,
    active: 0,
    triggered: 0,
    dismissed: 0,
    byType: { above: 0, below: 0 },
    byCoin: {},
  }

  alerts.forEach((alert) => {
    stats[alert.status]++
    stats.byType[alert.type]++
    stats.byCoin[alert.coin] = (stats.byCoin[alert.coin] || 0) + 1
  })

  return stats
}

export const validateAlert = (alert, currentPrice) => {
  if (!alert.coin || alert.coin.trim() === '') {
    return 'Coin symbol is required'
  }

  if (!alert.targetPrice || alert.targetPrice <= 0) {
    return 'Target price must be greater than 0'
  }

  if (alert.type === 'above' && alert.targetPrice <= currentPrice * 0.99) {
    return 'Above alert should be set higher than current price'
  }

  if (alert.type === 'below' && alert.targetPrice >= currentPrice * 1.01) {
    return 'Below alert should be set lower than current price'
  }

  return null
}

export const formatAlertMessage = (alert, currentPrice, currency) => {
  const direction = alert.type === 'above' ? 'above' : 'below'
  const emoji = alert.type === 'above' ? '🚀' : '📉'

  return `${emoji} ${alert.coin.toUpperCase()} is now ${direction} your alert price of ${alert.targetPrice.toFixed(
    2
  )} ${currency}. Current price: ${currentPrice.toFixed(2)} ${currency}`
}
