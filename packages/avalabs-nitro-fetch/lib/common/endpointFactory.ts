import { EndpointConfig } from "./endpoint";

export const makeRequest = (endpoint: EndpointConfig): Request => {
    const requestInit: RequestInit = {
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body,
    };

    return new Request(endpoint.url, requestInit);
}