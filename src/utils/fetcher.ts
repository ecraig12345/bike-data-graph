import { ApiResponse, ErrorData, ResponseData } from './types';

export async function fetcher(input: RequestInfo, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err) {
    throw String(err);
  }

  const text = await res.text();

  let json: ApiResponse<any> | undefined;
  try {
    json = JSON.parse(text);
  } catch (err) {
    // probably an HTML error page
  }

  if (res.ok) {
    return json
      ? (json as Object).hasOwnProperty('data')
        ? (json as ResponseData<any>).data
        : json
      : text;
  }

  if (json && (json as ErrorData).error) {
    throw (json as ErrorData).error;
  }
  throw res.statusText;
}
