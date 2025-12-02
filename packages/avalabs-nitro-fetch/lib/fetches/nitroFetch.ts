import { fetch as nitroFetch } from 'react-native-nitro-fetch';
import { EndpointConfig } from '../common/endpoint';
import { makeRequest } from '../common/endpointFactory';

export const fetchWithNitroConfig = async <T>(endpoint: EndpointConfig): Promise<T> => {
  const request = makeRequest(endpoint);
  const response = await fetch(request.url, {
    headers: request.headers,
    method: request.method,
    body: request.body || undefined,
  });

  const data = await response.json() as T;
  return data;
};

export const fetchWithNitro = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  const result = await nitroFetch(input, init);
  return result;
};
