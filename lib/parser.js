const Axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const moment = require('moment');
const qs = require('querystring');
const { stringBetween, tdValue, removeHtml, toNumber } = require('./helper');

axiosCookieJarSupport(Axios);

const cookieJar = new tough.CookieJar();

module.exports = {
  getIP: async () => {
    const ipify = await Axios.get('https://api.ipify.org/?format=json').then(res => res.data);
    return ipify.ip;
  },

  login: async (username, password, ip) => {
    const options = {
      method: 'POST',
      url: 'https://m.klikbca.com/authentication.do',
      data: qs.stringify({
        'value(user_id)': username,
        'value(pswd)': password,
        'value(Submit)': 'LOGIN',
        'value(actions)': 'login',
        'value(user_ip)': ip,
        user_ip: ip,
        'value(mobile)': true,
        mobile: true
      }),
      headers: {
        Origin: 'https://m.klikbca.com',
        Referer: 'https://m.klikbca.com/login.jsp',
        'User-Agent':
          'Mozilla/5.0 (Linux; U; Android 2.3.7; en-us; Nexus One Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
        'content-type': 'application/x-www-form-urlencoded'
      },
      jar: cookieJar,
      withCredentials: true
    };

    return Axios(options)
      .then(res => res.data)
      .then(result => {
        const success = result.includes('MENU UTAMA');
        if (!success) {
          let err = stringBetween(result, "var err='", "';");
          err = err || '';
          console.log('login not success');
          throw Error(err);
        }
        return true;
      })
      .catch(err => {
        console.log('login');
        throw err.message;
      });
  },

  openSettlementMenu: () => {
    const options = {
      method: 'POST',
      url: 'https://m.klikbca.com/accountstmt.do?value(actions)=menu',
      headers: {
        Referer: 'https://m.klikbca.com/authentication.do',
        'User-Agent':
          'Mozilla/5.0 (Linux; U; Android 2.3.7; en-us; Nexus One Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      },
      jar: cookieJar,
      withCredentials: true
    };
    return Axios(options).then(res => res.data);
  },

  balance: () => {
    const options = {
      method: 'POST',
      url: 'https://m.klikbca.com/balanceinquiry.do',
      headers: {
        Referer: 'https://m.klikbca.com/accountstmt.do?value(actions)=menu',
        'User-Agent':
          'Mozilla/5.0 (Linux; U; Android 2.3.7; en-us; Nexus One Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      },
      jar: cookieJar,
      withCredentials: true
    };
    return Axios(options)
      .then(res => res.data)
      .then(result => {
        return {
          rekening: stringBetween(result, "<td><font size='1' color='#0000a7'><b>", '</td>'),
          saldo: toNumber(
            stringBetween(result, "<td align='right'><font size='1' color='#0000a7'><b>", '</td>')
          )
        };
      })
      .catch(err => {
        console.log('balance');
        throw err.message;
      });
  },

  settlement: async () => {
    const options = {
      method: 'POST',
      url: 'https://m.klikbca.com/accountstmt.do?value(actions)=acct_stmt',
      headers: {
        Referer: 'https://m.klikbca.com/accountstmt.do?value(actions)=menu',
        'User-Agent':
          'Mozilla/5.0 (Linux; U; Android 2.3.7; en-us; Nexus One Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      },
      jar: cookieJar,
      withCredentials: true
    };
    try {
      const now = moment();
      const date = now.format('DD');
      const month = now.format('MM');
      const year = now.format('YYYY');

      await Axios(options).then(res => res.data);
      options.url = 'https://m.klikbca.com/accountstmt.do?value(actions)=acctstmtview';
      options.headers.Referer = 'https://m.klikbca.com/accountstmt.do?value(actions)=acct_stmt';
      options.data = qs.stringify({
        'value(r1)': 1,
        'value(D1)': 0,
        'value(startDt)': date,
        'value(startMt)': month,
        'value(startYr)': year,
        'value(endDt)': date,
        'value(endMt)': month,
        'value(endYr)': year
      });
      options['content-type'] = 'application/x-www-form-urlencoded';
      const result = await Axios(options).then(res => res.data);
      const cleanStmt = [];
      if (!result.includes('TIDAK ADA TRANSAKSI')) {
        let stmt = stringBetween(result, 'KETERANGAN', '<!--<tr>');
        stmt = tdValue(stmt);

        for (let i = 1; i <= stmt.length; i += 2) {
          const keteranganRaw = removeHtml(stmt[i].split('<br>').join('\n'));
          let keterangan = keteranganRaw.substring(0, keteranganRaw.length - 2);
          const nominal = toNumber(keterangan.split(/\r?\n/).pop());

          keterangan = keterangan.replace(/\r?\n?[^\r\n]*$/, '');
          const cab = keterangan.split(/\r?\n/).pop();
          keterangan = keterangan.replace(/\r?\n?[^\r\n]*$/, '');

          cleanStmt.push({
            tanggal: removeHtml(stmt[i - 1].split('<br>').join('\n')),
            keterangan,
            cab,
            nominal,
            mutasi: keteranganRaw.slice(-2)
          });
        }
      }

      return cleanStmt;
    } catch (err) {
      console.log('settlement');
      throw err.message;
    }
  },

  logout: () => {
    const options = {
      method: 'GET',
      url: 'https://m.klikbca.com/authentication.do?value(actions)=logout',
      headers: {
        Referer: 'https://m.klikbca.com/authentication.do?value(actions)=menu',
        'User-Agent':
          'Mozilla/5.0 (Linux; U; Android 2.3.7; en-us; Nexus One Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
      },
      jar: cookieJar,
      withCredentials: true
    };
    return Axios(options);
  }
};
