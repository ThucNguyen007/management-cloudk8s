#!/bin/bash

while ! curl http://product:product1234@product-rabbitmq:15672/api/aliveness-test/%2F; do sleep 1; done;

npm start

