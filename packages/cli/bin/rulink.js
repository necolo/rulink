#!/usr/bin/env node
import('../dist/index.cjs').then(m => m.default()).catch(console.error); 