# Building a production-ready payout process with the Modern Treasury API

This is an example of how to create a simple payout system with the the Modern Treasury API.

The features are:

 - A basic payout flow that moves money between internal accounts and external accounts via Automated Clearing House (ACH) transfers  
 - A system for onboarding and verifying new external accounts
 - A ledger for tracking transactions and account balances in real time
 - A notification system for returns and reversals via webhooks

 For simplicity I put all of the relevant API code in app.js.

## Tech stack
I'm using a minimial, accessible tech stack to help you get right to the basics of the API without the overhead of learning the latest trendy framework/library/package manager:

 - Vanilla JavaScript (remember that?)
 - Node.js (18)
 - Node-fetch (3.3.1)
 - Express (4.18.5)
 - Pug (3.0.2)
 - Nodemon (for dev)
 - [The Modern Treasury SDK](https://github.com/Modern-Treasury/modern-treasury-node)

## Getting started

Generate an API key in the MT Dashboard and add it to the top of app.js along with your Organization Id (also from the Dashboard).

To run the local server first cd into the source folder and run this:

    npm i

Then run the server:

    npm run start-dev

## Webhooks

This source includes example webhooks, which can be configured in the MT Dashboard.

Use something like [ngrok](https://dashboard.ngrok.com/get-started/setup_) to expose localhost enpoints, then paste the external links into the MT Dashboard.
