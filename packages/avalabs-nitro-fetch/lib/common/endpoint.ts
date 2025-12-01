export interface EndpointConfig {
    url: URL | string;
    headers?: Record<string, string>;
    method?: Method; 
    body?: BodyInit | null | undefined;
}

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';