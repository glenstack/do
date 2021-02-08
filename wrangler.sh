#!/bin/bash
mkdir dist; # https://github.com/cloudflare/wrangler/pull/1677#issuecomment-775534196
cargo run --manifest-path=../wrangler/Cargo.toml publish;
