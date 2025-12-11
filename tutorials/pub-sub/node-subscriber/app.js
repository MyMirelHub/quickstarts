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

const app = express();
// Dapr publishes messages with the application/cloudevents+json content-type
app.use(bodyParser.json({ type: 'application/*+json' }));

const port = 3000;



let simulateFailure = false;

app.get('/healthz', (_req, res) => {
    if (simulateFailure) {
        return;
    }
    res.status(200).send({status: 'ok'});
});

app.post('/trigger-failure', (_req, res) => {
    console.log("Simulating health check failure for 30 seconds...");
    simulateFailure = true;
    
    setTimeout(() => {
        console.log("Recovering from simulated failure...");
        simulateFailure = false;
    }, 90000);  // 30 seconds instead of 5
    
    res.status(200).send({message: "Triggered"});
});


app.get('/dapr/subscribe', (_req, res) => {
    const topics = [];
    for (let i = 0; i < 20; i++) {
        topics.push({
            pubsubname: "pubsub",
            topic: `Authorization.topic${i}`,
            route: `/handler${i}`
        });
    }
    res.json(topics);
});

// Add handlers for all topics
for (let i = 0; i < 20; i++) {
    app.post(`/handler${i}`, (req, res) => {
        console.log(`Handler ${i}: `, req.body.data);
        res.json({status: "SUCCESS"});
    });
}

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
