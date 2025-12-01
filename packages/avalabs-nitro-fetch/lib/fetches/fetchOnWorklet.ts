import { nitroFetchOnWorklet } from 'react-native-nitro-fetch';
import { EndpointConfig } from '../common/endpoint';
import { makeRequest } from '../common/endpointFactory';

export const fetchOnWorklet = async <T>(endpoint: EndpointConfig): Promise<T> => {
  const con = console;
    const mapResponse = (payload: { bodyString?: string }) => {
  'worklet';
      con.log('worklet payload:', payload);
  return JSON.parse(payload.bodyString ?? '{}') as T;
};
  const request = makeRequest(endpoint);
  const data = await nitroFetchOnWorklet(request, { 
    method: request.method,
    headers: request.headers,
    body: request.body || undefined,
  }, mapResponse, { preferBytes: false });


  con.log('Mapping response on worklet', data);
  return data;
};
