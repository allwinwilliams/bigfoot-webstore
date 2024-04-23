import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} remixContext
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
) {
  
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    connectSrc: [
        'https://api.stability.ai:*',
        'https://accounts.spotify.com',
        'https://accounts.spotify.com/api:*',
        'https://api.spotify.com',
        'https://api.spotify.com/v1/search:*',
        'https://firebaseinstallations.googleapis.com/',
        'https://firebaseinstallations.googleapis.com:*',
        'https://firestore.googleapis.com/',
        'https://firestore.googleapis.com:*',
        'https://firebasestorage.googleapis.com/',
        'https://firebasestorage.googleapis.com:*',
    ],
    imgSrc: [
      "'self'",
      'https://i.scdn.co', 
      'data:',
      'https://cdn.shopify.com',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  
  console.log("Content Security headers: ", header);
  
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
