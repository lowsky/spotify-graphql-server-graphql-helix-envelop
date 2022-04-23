import { makeExecutableSchema } from "@graphql-tools/schema"

import { fetchAlbumsOfArtist, fetchArtistsByName } from "./resolvers";

export const typeDefs = `
# The root of all queries:
directive @defer(if: Boolean, label: String) on FRAGMENT_SPREAD | INLINE_FRAGMENT

type Query {
  # Just returns "Hello world!"
  hi(message: String = "Hi"): String
  queryArtists(byName: String = "Red Hot Chili Peppers"): [Artist]
}
type Artist {
  name: String!
  id: ID
  image: String
  albums(limit: Int = 10): [Album]
}
type Album {
  name: String
  id: ID
  image: String
  tracks: [Track]
}
type Track {
  name: String!
  artists: [Artist]
  preview_url: String
  id: ID
}
`;

export const resolvers = {
  Query: {
    hi: () => 'Hello Hello Hello',
    queryArtists: async (_parent:any, { byName }: { byName: string }) => fetchArtistsByName(byName)
  },
  Artist: {
    albums: async (parent: { id: string }) => {
      return fetchAlbumsOfArtist(parent.id);
    }
  }
};

export const schema = makeExecutableSchema({typeDefs, resolvers});
