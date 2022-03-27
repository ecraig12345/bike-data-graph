/**
 * Fetch data from a URL.
 *
 * - A success response's body MUST be JSON.
 * - On error, throws either the error response's body or the status text
 *   (as a string, not an Error).
 *
 * @param input URL to fetch
 * @param options fetch options
 * @returns data if successful
 */
export async function fetcher<Data>(url: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw String(err);
  }

  const text = await res.text();

  let json: Data | undefined;
  try {
    json = JSON.parse(text);
  } catch (err) {
    // probably an HTML error page
  }

  if (res.ok) {
    if (json) {
      return json;
    }
    throw 'Response was not in JSON format';
  }

  throw text || res.statusText;
}
