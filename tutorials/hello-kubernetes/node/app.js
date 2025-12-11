//
// Copyright 2021 The Dapr Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

const express = require('express');
const bodyParser = require('body-parser');
require('isomorphic-fetch');

const app = express();
app.use(bodyParser.json());

// These ports are injected automatically into the container.
const daprHttpEndpoint = process.env.DAPR_HTTP_ENDPOINT ?? "http://localhost:3500"; 
const daprGRPCEndpoint = process.env.DAPR_GRPC_ENDPOINT ?? "http://localhost:50001";

const stateStoreName = process.env.STATE_STORE_NAME ?? "statestore";
const stateUrl = `${daprHttpEndpoint}/v1.0/state/${stateStoreName}`;
const port = process.env.APP_PORT ?? "3000";

let simulateFailure = false;

// Modify your existing healthz endpoint
app.get('/healthz', (_req, res) => {
    if (simulateFailure) {
        // Don't respond at all to simulate timeout
        return;
    }
    res.status(200).send({status: 'ok'});
});

// Modify your trigger-failure endpoint to last longer
app.post('/trigger-failure', (_req, res) => {
    console.log("Simulating health check failure for 30 seconds...");
    simulateFailure = true;
    
    setTimeout(() => {
        console.log("Recovering from simulated failure...");
        simulateFailure = false;
    }, 30000);  // 30 seconds instead of 5
    
    res.status(200).send({message: "Triggered"});
});


app.get('/dapr/subscribe', (_req, res) => {
    res.json([
        {
            pubsubname: "pubsub",  // matches the component name
            topic: "orders",
            route: "/orders"        // where to send messages
        },
        {
            pubsubname: "pubsub",
            topic: "inventory", 
            route: "/inventory"
        }
    ]);
});

// Handler endpoints for the subscriptions
app.post('/orders', (req, res) => {
    console.log("Received order event:", req.body);
    res.status(200).send();
});

app.post('/inventory', (req, res) => {
    console.log("Received inventory event:", req.body);
    res.status(200).send();
});

app.get('/order', async (_req, res) => {
    try {
        const response = await fetch(`${stateUrl}/order`);
        if (!response.ok) {
            throw "Could not get state.";
        }
        const orders = await response.text();
        res.send(orders);
    }
    catch (error) {
        console.log(error);
        res.status(500).send({message: error});
    }
});

app.post('/neworder', async (req, res) => {
    const data = req.body.data;
    const orderId = data.orderId;
    console.log("Got a new order! Order ID: " + orderId);

    const state = [{
        key: "order",
        value: data
    }];

    try {
        const response = await fetch(stateUrl, {
            method: "POST",
            body: JSON.stringify(state),
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw "Failed to persist state.";
        }
        console.log("Successfully persisted state for Order ID: " + orderId);
        res.status(200).send();
    } catch (error) {
        console.log(error);
        res.status(500).send({message: error});
    }
});

app.get('/ports', (_req, res) => {
    console.log("DAPR_HTTP_ENDPOINT: " + daprHttpEndpoint);
    console.log("DAPR_GRPC_ENDPOINT: " + daprGRPCEndpoint);
    res.status(200).send({DAPR_HTTP_ENDPOINT: daprHttpEndpoint, DAPR_GRPC_ENDPOINT: daprGRPCEndpoint })
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
