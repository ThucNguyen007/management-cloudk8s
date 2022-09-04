#!/bin/bash

while ! curl http://product-elastic:9200; do sleep 1; done;

npm start
