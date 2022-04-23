import fetch from "node-fetch";

import client_credentials from "./client_credentials";

function errorMsg (error: Error& {status?:string}) {
    if (error) {
        const { status = '', message = 'no details' } = error;
        return `Error: ${status}: ${message}`;
    }
    return 'An unknown error!'
}

function throwExceptionOnError<TDATA>(data: { error?:Error }) {
    if (data.error) {
        throw new Error(errorMsg(data.error));
    }
}

const headers = {
    'Accept': 'application/json',
    'Authorization': ''
};

let awaitingAuthorization: Promise<string>|undefined = undefined;

// const spotifyProxy = async ()  => {
const spotifyProxy = () : Promise<string> => {
    if (awaitingAuthorization && !client_credentials.isExpired()) {
        // use existing promise, if not expired
        return awaitingAuthorization;
    }
    if (!awaitingAuthorization || client_credentials.isExpired()) {
        awaitingAuthorization = new Promise((resolve, reject) => {
            client_credentials.authenticate()
                .then((token) => {
                    headers.Authorization = 'Bearer ' + token.access_token;
                    resolve(token.access_token);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    return awaitingAuthorization;
};

const haveHeadersWithAuthToken = async () => {
    await spotifyProxy()
    return headers;
};


export const fetchArtistsByName = async (name: string) => {
    console.log(`debug: query artist ${name} `);

    const response = await fetch(`https://api.spotify.com/v1/search?q=${name}&type=artist`, {
        headers: await haveHeadersWithAuthToken()
    });
    const data = await response.json() as {
        error?: Error, artists: { items: [object] }
        };
    throwExceptionOnError(data);

    return (data.artists.items || [])
    // @ts-ignore
        .map((artistRaw:object) => spotifyJsonToArtist(artistRaw));
};

export const fetchAlbumsOfArtist = async (artistId:string, limit?:number) => {
    console.log(`debug: query albums of artist ${artistId} `);

    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
        headers: await haveHeadersWithAuthToken()
    });
    const data = await response.json() as {
        items: [object],
        error?: Error
    };
    throwExceptionOnError(data);

    return (data.items || [])
        .map((albumRaw:object) => spotifyJsonToAlbum(albumRaw));
};

const spotifyJsonToArtist = async (raw:object&{
    images: [{url:string}]
    id:string
}) => {
    return {
        // fills with raw data (by ES6 spread operator):
        ...raw,

        // This needs extra logic: defaults to an empty string, if there is no image
        // else: just takes URL of the first image
        image: raw.images[0]?.url ?? '',
    };
};

const spotifyJsonToAlbum = (albumRaw: object & {
    images?: [{ url?:string }]
}) => {
    return {
        // fills with raw data (by ES6 spread operator):
        ...albumRaw,

        // This needs extra logic: defaults to an empty string, if there is no image
        // else: just takes URL of the first image
        image: albumRaw?.images?.[0]?.url ?? '',

        tracks: [] // TODO implement fetching of tracks of album
    };
};
