#!/usr/bin/env bash

init:
	@make dep

dep:
	@echo "Install dependencies required for this repo..."
	@yarn

upgrade:
	@echo "Upgraded dependencies required for this repo..."
	@ncu -u -f /arcblock\|ocap\|abtnode\|blocklet/ && yarn

lint:
	@echo "Running lint..."
	@npm run lint

test:
	@echo "Running test suites..."
	@npm run coverage

build:
	@echo "Building the software..."
	@npm run build

clean:
	@echo "Cleanup dependencies required for this repo..."
	@npm run clean

include .makefiles/*.mk
