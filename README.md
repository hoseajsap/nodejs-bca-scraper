# nodejs-klikbca-parser

Plugin untuk membantu anda mendapatkan informasi saldo terakhir rekening BCA anda serta mutasi rekening BCA anda pada hari itu melalui KlikBCA.

## Cara Install

```bash
npm install --save nodejs-klikbca-parser
```

## Penggunaan

```javascript
const bca = require('nodejs-klikbca-parser');
```

### Cek Saldo Terakhir

```javascript
bca
  .getBalance(USERNAME, PASSWORD)
  .then(res => {
    console.log('saldo ', res);
  })
  .catch(err => {
    console.log('error ', err);
  });
```

### Cek Settlement Pada Hari Itu

```javascript
bca
  .getSettlement(USERNAME, PASSWORD)
  .then(res => {
    console.log('settlement ', res);
  })
  .catch(err => {
    console.log('error ', err);
  });
```

### Cek Settlement & Saldo Terakhir

```javascript
bca
  .getAll(USERNAME, PASSWORD)
  .then(({settlement, balance}) => {
    console.log('settlement ', settlement);
    console.log('balance ', balance)
  })
  .catch(err => {
    console.log('error ', err)
  })
```

# License

MIT

# Author
Original Author
[Achmad Apriady](mailto:achmad.apriady@gmail.com)

Modified by
[Hosea Jovian](mailto:hosea.jovian@gmail.com)
