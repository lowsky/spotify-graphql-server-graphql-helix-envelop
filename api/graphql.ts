import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getGraphQLParameters, processRequest, renderGraphiQL, sendResult, shouldRenderGraphiQL } from "graphql-helix";
import { envelop, useEngine, useSchema } from "@envelop/core"
import { execute, parse, subscribe, validate } from 'graphql';

import {schema} from "../data/schema";

const getEnveloped = envelop({
    enableInternalTracing: true,
    plugins: [
        useSchema(schema),
        useEngine({ parse, validate, execute, subscribe })
    ],
})

export default async (req: VercelRequest, res: VercelResponse) => {
    const request = {
        body: req.body,
        headers: req.headers,
        method: req.method ?? 'POST',
        query: req.query
    }

    // Determine whether we should render GraphiQL instead of returning an API res
    if (shouldRenderGraphiQL(request)) {
        res.setHeader("Content-Type", "text/html");
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
};
