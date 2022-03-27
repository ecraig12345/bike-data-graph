/**
 * Fetch data from a URL. A success response's body MUST be JSON.
 * On error, throws an error containing the response's body or the status text.
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
    throw new Error('Response was not in JSON format');
  }

  throw new Error(text || res.statusText);
}
