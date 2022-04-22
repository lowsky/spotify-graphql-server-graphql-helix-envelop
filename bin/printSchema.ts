#!/usr/bin/env node

import { printSchema } from "graphql";

import { schema } from "../data/schema";

console.log(printSchema(schema));
