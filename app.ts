import express from "express";
import path from "path";
import logger from "morgan";
import cors from "cors";

import { getGraphQLParameters, processRequest, renderGraphiQL, sendResult, shouldRenderGraphiQL } from "graphql-helix";
import { envelop, useSchema, useLogger } from "@envelop/core"

import {schema} from "./data/schema";
import { fetchArtistsByName } from "./data/resolvers";

const getEnveloped = envelop({
  enableInternalTracing:true,
  plugins: [useSchema(schema), ]
})


const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.static(path.join('.', 'public')));

const rootValue = {
  hi: () => 'Hello world!',
  queryArtists: ({ byName }: { byName: string }) => fetchArtistsByName(byName)
};

// API middleware

// @ts-expect-error TS2769: No overload matches this call.
app.use('/graphql', cors(), async function (req, res) {
    const {schema} = getEnveloped({
      req
    })
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query
    }
    const {operationName, query, variables} = getGraphQLParameters(request)

    // Determine whether we should render GraphiQL instead of returning an API response
    if (shouldRenderGraphiQL(request)) {
      res.header("Content-Type", "text/html");
      res.send(renderGraphiQL());
      return;
    }

    const result = await processRequest({
      operationName,
      query,
      variables,
      rootValueFactory: () => rootValue,
      request,
      schema,
    })

    await sendResult(result, res);
  }
);

export default app;
