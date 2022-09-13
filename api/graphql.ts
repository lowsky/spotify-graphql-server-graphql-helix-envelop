import { getGraphQLParameters, processRequest, renderGraphiQL, sendResult, shouldRenderGraphiQL } from "graphql-helix";
import { envelop, useSchema } from "@envelop/core"
import type { VercelRequest, VercelResponse } from '@vercel/node';

import {schema} from "../data/schema";

const getEnveloped = envelop({
    enableInternalTracing:true,
    plugins: [useSchema(schema), ]
})

export default async (request: VercelRequest, response: VercelResponse) => {
    const envRequest = {
        body: request.body,
        headers: request.headers,
        method: request.method ?? 'POST',
        query: request.query
    }

    // Determine whether we should render GraphiQL instead of returning an API response
    if (shouldRenderGraphiQL(envRequest)) {
        response.setHeader("Content-Type", "text/html");
        response.send(renderGraphiQL({
            endpoint: '/api/graphql',
        }));
        return;
    }
    const {parse, validate, contextFactory, execute, schema} = getEnveloped({
        request
    })

    const {operationName, query, variables} = getGraphQLParameters(envRequest)
    const result = await processRequest({
        parse,
        validate,
        execute,
        contextFactory,

        operationName,
        query,
        variables,
        request: envRequest,
        schema,
    })

    await sendResult(result, response);
};
