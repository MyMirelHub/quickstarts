#
# Copyright 2021 The Dapr Authors
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import os
import requests
import time

dapr_http_endpoint = os.getenv("DAPR_HTTP_ENDPOINT", "http://localhost:3500")
dapr_url = "{}/neworder".format(dapr_http_endpoint)

n = 0
while True:
    n += 1
    try:
        # Publish to pubsub instead of invoking directly
        response = requests.post(
            "http://localhost:3500/v1.0/publish/pubsub/orders",
            json={"orderId": n}
        )
        print(f"Published {n}: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    time.sleep(1)