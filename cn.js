var { URLSearchParams } = require('url');
var fetch = require('node-fetch');

(function() {
  const API_URL = 'https://changenow.io/api/v1/';

  class ApiError extends Error {
    constructor({ error, message = '' }, status = '') {
      super();
      this.message = `${error}, message: ${message}`;
      this.status = status;
    }
  }

  const apiCall = async (url, params) => {
    try {
      const res = await fetch(url, params);
      const responseData = await res.json();
      if (!res.ok) {
        const apiError = new ApiError(responseData, res.status);
        throw apiError;
      }
      return responseData;
    } catch (error) {
      throw error;
    }
  };

  async function apiGet(url, params = {}) {
    const searchParams = new URLSearchParams('');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  
    const requsetUrl = `${url}?${searchParams.toString()}`;
    const data = await apiCall(requsetUrl, { method: 'GET' });
    return data;
  }
  
  async function apiPost(url, body = {}) {
    const data = await apiCall(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(body)
    });
    return data;
  }
  
  const cnApiClinet = {
    'CURRENCIES': async function getCurrencies({ active, fixedRate }, callback) {
      const url = `${API_URL}currencies`;
      const res = await apiGet(url, { active, fixedRate });
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'CURRENCIES_TO': async function getCurrenciesTo({ ticker, fixedRate }, callback) {
      const url = `${API_URL}currencies-to/${String(ticker).toLowerCase()}`;
      const res = await apiGet(url, { fixedRate });
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'CURRENCY_INFO': async function getCurrencyInfo({ ticker }, callback) {
      const url = `${API_URL}currencies/${String(ticker).toLowerCase()}`;
      const res = await apiGet(url);
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'LIST_OF_TRANSACTIONS': async function getTxLsit(params, callback) {
      const { apiKey = '', from, to, status, limit = 10, offset = 0, dateFrom = '', dateTo = '' } = params;
      const queryParams = { from, to, status, limit, offset, dateFrom, dateTo };
      const url = `${API_URL}transactions/${apiKey}`;
      const res = await apiGet(url, { ...queryParams});
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'TX_STATUS': async function getTxStatus({ id, apiKey = '' }, callback) {
      const url = `${API_URL}transactions/${id}/${apiKey}`;
      const res = await apiGet(url);
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'ESTIMATED': async function getEstimated(params, callback) {
      const { apiKey = '', from, to, amount, fixedRate} = params;
      const fromTo = `${String(from).toLowerCase()}_${String(to).toLowerCase()}`;
      const url = `${API_URL}exchange-amount`;
      const urlParams =  `${fixedRate === true ? '/fixed-rate' : ''}/${amount}/${fromTo}`;
      const requsetUrl = url + urlParams;
      const res = await apiGet(requsetUrl, { api_key: apiKey});
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'CREATE_TX': async function createTx(params, callback) {
      const { 
        apiKey = '', from, to, address, amount, extraId, refundAddress, refundExtraId, userId, payload, contactEmail, fixedRate
      } = params;
      const url = `${API_URL}transactions`;
      const urlParams =  `${fixedRate === true ? '/fixed-rate' : ''}/${apiKey}`;
      const requsetUrl = url + urlParams;
      const body = {
        from,
        to,
        address,
        amount,
        extraId: extraId || '',
        refundAddress: refundAddress || '',
        refundExtraId: refundExtraId || '',
        userId: userId || '',
        payload: payload || '',
        contactEmail: contactEmail || ''
      };
      const res = await apiPost(requsetUrl, body);
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'PAIRS' : async function getPairs({ includePartners }, callback) {
      const url = `${API_URL}market-info/available-pairs`
      const res = await apiGet(url, { includePartners });
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'FIXED_RATE_PAIRS': async function getFixedRatePairs({ apiKey = '' }, callback) {
      const url = `${API_URL}/market-info/fixed-rate/${apiKey}`;
      const res = await apiGet(url);
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    },
    'MIN_AMOUNT': async function getMinAmout({ from ,to }, callback) {
      const fromTo = `${String(from).toLowerCase()}_${String(to).toLowerCase()}`;
      const url = `${API_URL}/min-amount/${fromTo}`;
      const res = await apiGet(url);
      if (!!callback && typeof callback === 'function') {
        callback(res);
      }
      return res;
    }
  };
  
  async function cnApiWrapper(callName, callPrams, callback) {
    const method = cnApiClinet[callName];
    const params = callPrams || {};
    if (!method) {
      const err = new Error(`Undefined api method: ${callName}`);
      throw err;
    }
    const res = await method(params, callback);
    return res;
  }

  function round(n) {
    return Math.round(n*10000)/10000;
  }

  async function rates(amount, bestRate) {
    const response1 = await cnApiWrapper('ESTIMATED', { amount: amount, from:'BTC', to:'XMR', apiKey:'c1863663156c445d2df69f4a8ff05a94429e39910d72b4ec2a0ce345e2ec573a' });
    const response2 = await cnApiWrapper('ESTIMATED', { amount: response1.estimatedAmount, from:'XMR', to:'BTC', apiKey:'c1863663156c445d2df69f4a8ff05a94429e39910d72b4ec2a0ce345e2ec573a' });

    console.log(`${amount.toPrecision(3)}: ${response2.estimatedAmount.toPrecision(6)} ${(100*response2.estimatedAmount/amount).toPrecision(6)}%  rate1: ${(response1.estimatedAmount/amount).toPrecision(6)} rate2: ${(response2.estimatedAmount/response1.estimatedAmount).toPrecision(6)}  xmr: ${response1.estimatedAmount.toPrecision(4)} loss1: ${100*(bestRate*response1.estimatedAmount/amount).toPrecision(4)}% loss2: ${100*(response2.estimatedAmount/response1.estimatedAmount/bestRate).toPrecision(4)}%`);
  }

  async function realRate() {
    const response = await apiCall('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=btc', { method: 'GET' });
    // console.log('realRate',response);
    return response.monero.btc;
  }
  
  async function main() {
    // if (window !== undefined) {
      // window.cnApiWrapper = cnApiWrapper;
    // }
    // const response = await cnApiWrapper('CURRENCIES', { fixedRate: true });
    // const response = await cnApiWrapper('ESTIMATED', {amount: .1, from:'BTC', to:'XMR', apiKey:'c1863663156c445d2df69f4a8ff05a94429e39910d72b4ec2a0ce345e2ec573a' });


    // console.log(response);
    const bestRate = await realRate();

    await rates(0.05, bestRate);
    await rates(0.1, bestRate);
    await rates(0.2, bestRate);
    await rates(0.3, bestRate);
    await rates(0.4, bestRate);
    await rates(0.5, bestRate);
    await rates(0.6, bestRate);
    await rates(0.7, bestRate);
    await rates(0.8, bestRate);
    await rates(0.9, bestRate);
    await rates(1.0, bestRate);
    await rates(1.1, bestRate);
    await rates(1.2, bestRate);
    await rates(1.3, bestRate);
    await rates(1.4, bestRate);
    await rates(1.5, bestRate);
    
    // await rates(10);

    /*
    let price = require('crypto-price');
    price.getCryptoPrice('XMR', 'BTC').then(obj => { // Base for ex - USD, Crypto for ex - ETH 
      console.log(obj.price);
    }).catch(err => {
      console.log(err);
    });
    */
  }
  
  main();
}());

// cnApiWrapper()
