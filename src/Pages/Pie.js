import { Component } from 'react'
import Highcharts from 'highcharts'

class Pie extends Component {
  _chartOptions() {
    const data = []
    const marketData = this.props.marketData || {}
    const totalValue =
      (this.props.totalPortfolio && this.props.totalPortfolio.totalValue) || 0
    for (const coin in this.props.coinz) {
      const holding =
        (this.props.coinz[coin] && this.props.coinz[coin].hodl) || 0
      const priceObj = marketData[coin] && marketData[coin].ticker
      const price =
        priceObj && typeof priceObj.price !== 'undefined'
          ? Number(priceObj.price) * this.props.exchangeRate
          : 0
      const value = holding * price
      const y = totalValue > 0 ? value / totalValue : 0
      data.push({
        name: coin.toUpperCase(),
        y: y,
      })
    }

    // Make monochrome colors
    var pieColors = (() => {
      var colors = [],
        base = '#21ce99', //Highcharts.getOptions().colors[0],
        i

      for (i = 0; i < 10; i += 1) {
        // Start out with a darkened base color (negative brighten), and end
        // up with a much brighter color
        colors.push(
          Highcharts.Color(base)
            .brighten((i - 3) / 7)
            .get()
        )
      }
      return colors
    })()

    return {
      credits: false,
      chart: {
        renderTo: 'piechart',
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        backgroundColor: 'transparent',
      },
      title: {
        text: '',
      },
      tooltip: {
        pointFormat: '<b>{point.percentage:.1f}%</b>',
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          colors: pieColors,
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b><br/>{point.percentage:.1f} %',
            style: {
              color: 'white',
            },
          },
        },
      },
      series: [
        {
          colorByPoint: true,
          data: data,
        },
      ],
    }
  }

  componentDidMount() {
    // Set container which the chart should render to.
    this.chart = new Highcharts[this.props.type || 'Chart'](
      'piechart',
      //this.props.options
      this._chartOptions()
    )
  }

  //Destroy chart before unmount.
  componentWillUnmount() {
    this.chart && this.chart.destroy()
  }

  render() {
    const home = this.props.blockstack ? '/blockstack' : '/'

    return (
      <div className="Pie">
        <div id="piechart"></div>
      </div>
    )
  }
}

export default Pie
