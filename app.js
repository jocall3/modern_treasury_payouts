import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import ModernTreasury from 'modern-treasury';

// Generate your API key on the MT Dashboard. The organization Id can be found 
// there as well.
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

  // Internal accounts are generally accounts in your name. 
  // We'll get the accounts that support ACH transfers.
  const internalAccounts = [];
  for await (const internalAccount of modernTreasury.internalAccounts.list({
    payment_type: 'ach'
  })) {
    internalAccounts.push(internalAccount);
  }

  // External accounts are accounts that are not in your name, such as a client
  // or freelancer.
  const externalAccounts = [];
  for await (const externalAccount of modernTreasury.externalAccounts.list()) {
    externalAccounts.push(externalAccount);
  }

  return response.render('payout', { 
    internalAccounts, internalAccounts,
    externalAccounts: externalAccounts
  });
});

app.get('/payout-with-ledger', async (request, response) => {
  
  // Internal accounts are generally accounts in your name.
  // We'll get the accounts that support ACH transfers.
  const internalAccounts = [];
  for await (const internalAccount of modernTreasury.internalAccounts.list({
    payment_type: 'ach'
  })) {
    internalAccounts.push(internalAccount);
  }

  // External accounts are accounts that are not in your name, such as a client
  // or freelancer.
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
  
  // The MT API does not seem to support ledgers yet so we'll use a simple 
  // fetch() request.
  const url = 'https://app.moderntreasury.com/api/user_onboardings';

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(ORGANIZATION_ID 
      + ':' + API_KEY).toString('base64')
  });

  // Example of what an onboarding request body might look like.
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
  
  // Create an ACH transfer between the selected internal and external account.
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

  // A ledger must reference a credit and debit account.
  // Create these accounts in the Dashboard.
  const CREDIT_LEDGER_ACCOUNT_ID = '<credit ledger account id>';
  const DEBIT_LEDGER_ACCOUNT_ID = '<debit ledger account id>';

  // Example of a ledger transaction object to be sent to the ledger.
  const ledgerTransactionObject = {
    description: request.body.description,
    status: 'pending',
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

  // Send the payment order with the ledger transaction object to instantly 
  // create the ledger entry.
  const paymentOrder = await modernTreasury.paymentOrders.create({
    'type': 'ach',
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

// This endpoint is notified when a new account has been onboarded.
app.post('/onboarding-hook', (request, response) => {
  if (request.body.data.status === 'approved') console.log('Approved!');
 
  response.status(200).end();
 });    

// This endpoint when a payment has been returned, and as is progresses through
// the return process pipeline.
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

// This endpoint when a payment has been reversed, and as is progresses through
// the reversal process pipeline.
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