#!/bin/bash
./node_modules/.bin/lerna version patch -y
./node_modules/.bin/lerna publish from-package -y