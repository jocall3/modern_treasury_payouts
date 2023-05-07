# Building a production-ready payout process with the Modern Treasury API

This is an example of how to create a a simple payout system with the the Modern Treasury API.

The features are:

 - A basic payout flow that moves money between internal accounts and external accounts via Automated Clearing House (ACH) transfers  
 - A system for onboarding and verifying new external accounts
 - A ledger for tracking transactions and account balances in real time
 - A notification system for returns and reversals via webhooks

 For simplicity I've all of the relevant API code in app.js.

## Tech stack
I'm using a dead simple tech stack to minimize the overhead of learning the latest framework/library/package manager:

 - Vanilla JavaScript (remember that?)
 - Node.js (18)
 - Node-fetch (3.3.1)
 - Express (4.18.5)
 - Pug (3.0.2)
 - Nodemon (for dev)
 - [The Modern Treasury SDK](https://github.com/Modern-Treasury/modern-treasury-node)

## Installation

Just this:

    npm i

## Running the local server

    npm run start-dev

## Webhooks

This source includes example webhooks. Use something like [ngrok](https://dashboard.ngrok.com/get-started/setup_) to expose localhost enpoints.
