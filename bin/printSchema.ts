#!/usr/bin/env node

// @ts-expect-error TS2792: Cannot find module 'graphql'.
import { printSchema } from "graphql";

import { schema } from "../data/schema";

console.log(printSchema(schema));
