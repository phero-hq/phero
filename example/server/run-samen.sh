#!/bin/bash

lerna bootstrap
chmod +x ../server/node_modules/.bin/samen
chmod +x ../client/node_modules/.bin/samen
./node_modules/.bin/samen build
