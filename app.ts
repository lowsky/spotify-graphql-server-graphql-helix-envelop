import express from "express";
import path from "path";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import { NextFunction, Request, Response } from "express-serve-static-core";

import { getGraphQLParameters, processRequest, renderGraphiQL, sendResult, shouldRenderGraphiQL } from "graphql-helix";
import { envelop, useSchema, useLogger } from "@envelop/core"

import {schema} from "./data/schema";
import { fetchArtistsByName } from "./data/resolvers";

const getEnveloped = envelop({
  enableInternalTracing:true,
  plugins: [useSchema(schema), useLogger() ]
})


const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
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


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  // @ts-ignore
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    console.log(err)
    res.status(err.status || 500);
    res.send(`Sorry, there was this error: ` + `
      <h1>${err.message}</h1>
      <h2>${err.status}</h2>
      <pre>${err.stack}</pre>
  `);

  });
}

// production error handler
// no stack-traces leaked to user
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  res.status(err.status || 500);
  res.send(`Sorry, there was this error: ` + `
  <h1>${err.message}</h1>
  <h2>${err.status}</h2>
  <pre>${err.stack}</pre>
  `);
});

export default app;
