// @ts-expect-error TS2792: Cannot find module 'graphql'.
import { mockServer } from "@graphql-tools/mock";

import { schema } from "../data/schema";

let cnt = 0;

const simpleMockServer = mockServer(schema, {
    String: () => 'loremipsum ' + (cnt++),
    Album: () => {
        return {
            name: () => {return 'Album#1'}
        };
    }
});

const result = simpleMockServer.query(`{
    queryArtists(byName:"Marilyn Manson") {
        name
        albums {
            name
            tracks {
                name
                artists { name }
            }
        }
    }
}`);

result.then((data:any) => {
    console.log('data: ', JSON.stringify(data, null, 1));
}).catch((error:Error) => {
    console.log('error: ', error);
});
