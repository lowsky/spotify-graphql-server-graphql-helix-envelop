import express from "express";
import path from "path";
import cors from "cors";

import { getGraphQLParameters, processRequest, renderGraphiQL, sendResult, shouldRenderGraphiQL } from "graphql-helix";
import { envelop, useEngine, useSchema } from "@envelop/core"
import { execute, parse, subscribe, validate } from 'graphql';

import {schema} from "./data/schema";
import { fetchArtistsByName } from "./data/resolvers";

const getEnveloped = envelop({
  enableInternalTracing: true,
  plugins: [
    useSchema(schema),
    useEngine({ parse, validate, execute, subscribe })
  ],
})


const app = express();

app.use(express.json());
app.use(express.static(path.join('.', 'public')));

const rootValue = {
  hi: () => 'Hello world!',
  queryArtists: ({ byName }: { byName: string }) => fetchArtistsByName(byName)
};

// API middleware

app.use('/api/graphql', cors(), async function (req, res) {
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query
    }

    // Determine whether we should render GraphiQL instead of returning an API response
    if (shouldRenderGraphiQL(request)) {
      res.header("Content-Type", "text/html");
      res.send(renderGraphiQL({
        endpoint: '/api/graphql',
      }));
      return;
    }

    const {parse, validate, contextFactory, execute, schema} = getEnveloped({})

    const {operationName, query, variables} = getGraphQLParameters(request)

    const result = await processRequest({
      parse,
      validate,
      execute,
      contextFactory,

      operationName,
      query,
      variables,
      request,
      schema,
    })

    await sendResult(result, res);
  }
);

export default app;
