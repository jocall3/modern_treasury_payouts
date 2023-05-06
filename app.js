import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import ModernTreasury from 'modern-treasury';

// Your organization id and API key here:
const ORGANIZATION_ID = '<your organziation id here>';
const API_KEY = '<your API key here>';
const modernTreasury = new ModernTreasury({
  apiKey: API_KEY,
  organizationId: ORGANIZATION_ID,
});

const app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ROUTES

app.get('/', (request, response) => {
  return response.render('index');
});

app.get('/onboarding', (request, response) => {
  return response.render('onboarding');
});

app.get('/payout', async (request, response) => {
  const internalAccounts = [];
  for await (const internalAccount of modernTreasury.internalAccounts.list({payment_type: 'ach'})) {
    internalAccounts.push(internalAccount);
  }

  const externalAccounts = [];
  for await (const externalAccount of modernTreasury.externalAccounts.list({payment_type: 'ach'})) {
    externalAccounts.push(externalAccount);
  }

  return response.render('payout', { 
    internalAccounts, internalAccounts,
    externalAccounts: externalAccounts
  });
});

app.get('/payout-with-ledger', async (request, response) => {
  const internalAccounts = [];
  for await (const internalAccount of modernTreasury.internalAccounts.list({payment_type: 'ach'})) {
    internalAccounts.push(internalAccount);
  }

  const externalAccounts = [];
  for await (const externalAccount of modernTreasury.externalAccounts.list()) {
    externalAccounts.push(externalAccount);
  }

  return response.render('payout_with_ledger', { 
    internalAccounts, internalAccounts,
    externalAccounts: externalAccounts
  });
});

// FORM REQUESTS

app.post('/onboard', async (request, response) => {
  const url = 'https://app.moderntreasury.com/api/user_onboardings';

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(ORGANIZATION_ID + ':' + API_KEY).toString('base64')
  });

  const body = JSON.stringify({
    status: 'processing',
    flow_alias: 'my-test-flow',
    data: {
      first_name: request.body.first_name,
      last_name: request.body.last_name,
      date_of_birth: request.body.date_of_birth,
      phone_number: request.body.phone_number,
      email: request.body.email,
      address: {
        line1: request.body.address_line1,
        line2: request.body.address_line2,
        locality: request.body.address_locality,
        region: request.body.address_region,
        postal_code: request.body.address_postal_code,
        country: request.body.address_country,
      },
      taxpayer_identifier: request.body.taxpayer_identifier,
      external_account: {
        account_details: [
          {
            account_number: request.body.account_number,
            account_number_type: request.body.account_number_type,
          },
        ],
        routing_details: [
          {
            routing_number: request.body.routing_number,
            routing_number_type: request.body.routing_number_type,
          },
        ],
        account_type: request.body.account_type,
      },
    },
  });
  
  fetch(url, {
    method: 'POST',
    headers: headers,
    body: body
  })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));

  return response.send(request.body);  
});

app.post('/pay', async (request, response) => {
  const paymentOrder = await modernTreasury.paymentOrders.create({
    'type': 'ach',
    'amount': request.body.amount,
    'direction': 'credit',
    'currency': 'USD',
    'originating_account_id': request.body.internalAccount,
    'receiving_account_id': request.body.externalAccount
  });

  return response.send(request.body);
});

app.post('/pay-with-ledger', async (request, response) => {
  const CREDIT_LEDGER_ACCOUNT_ID = '<credit ledger account id>';
  const DEBIT_LEDGER_ACCOUNT_ID = '<debit ledger account id>';

  const ledgerTransactionObject = {
    description: request.body.description,
    status: 'posted',
    ledger_entries: [
      {
        amount: request.body.amount, 
        direction: 'credit', 
        ledger_account_id: CREDIT_LEDGER_ACCOUNT_ID
      },
      {
        amount: request.body.amount, 
        direction: 'debit', 
        ledger_account_id: DEBIT_LEDGER_ACCOUNT_ID
      }
    ]
  };

  const paymentOrder = await modernTreasury.paymentOrders.create({
    'type': "ach",
    'amount': request.body.amount,
    'direction': 'credit',
    'currency': 'USD',
    'originating_account_id': request.body.internalAccount,
    'receiving_account_id': request.body.externalAccount,
    'ledger_transaction': ledgerTransactionObject
  });

  return response.send(request.body);
});

// HOOKS

app.post('/onboarding-hook', (request, response) => {
  if (request.body.data.status === 'approved') console.log('Approved!');
 
  response.status(200).end();
 });    

app.post('/return-hook', (request, response) => {
  const status = request.body.data.status;    
  const amount = request.body.data.amount;
  const reason = request.body.data.reason;
  const returnableId = request.body.data.returnable_id;

  switch (status) {
    case 'pending':
      console.log(`A return for ${amount} has just been processed for the following reason: ${reason}`);
      break;

    case 'completed':
      console.log(`The return for ${returnableId} has been completed for the amount of ${amount}`);
      break;

    default:
      console.log(`Current return status for ${returnableId} is ${status}`);
  }

  response.status(200).end()
});      
  
app.post('/reversal-hook', (request, response) => {
  const status = request.body.data.status;    
  const paymentOrderId = request.body.data.payment_order_id;

  switch (status) {
    case 'pending':
      console.log(`A reversal for ${paymentOrderId} has just been processed for the following reason: ${reason}`);
      break;

    case 'completed':
      console.log(`The reversal for ${paymentOrderId} has been completed.`);
      break;

    default:
      console.log(`Current reversal status for ${paymentOrderId} is ${status}`);
  }

  response.status(200).end()
});

app.listen(3000, () => {
  console.log('server running at 3000');
});
