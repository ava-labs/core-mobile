import {
  FetchHttpRequest,
  type OpenAPIConfig,
  type ApiRequestOptions,
  CancelablePromise
} from '@avalabs/glacier-sdk'
import Config from 'react-native-config'

const GLOBAL_QUERY_PARAMS: Record<string, string | undefined> = {
  rltoken: Config.GLACIER_API_KEY
}

/**
 * Custom HTTP request handler that automatically appends the Glacier API key (if present)
 * to bypass rate limits in development environments.
 */
export class GlacierFetchHttpRequest extends FetchHttpRequest {
  constructor(config: OpenAPIConfig) {
    super(config)
  }

  public override request<T>(options: ApiRequestOptions): CancelablePromise<T> {
    // Merge global query parameters with request-specific ones
    const mergedQuery = {
      ...GLOBAL_QUERY_PARAMS,
      ...(options.query || {}) // Request-specific params (override globals if same key)
    }

    // Create modified options with merged query
    const modifiedOptions: ApiRequestOptions = {
      ...options,
      query: Object.keys(mergedQuery).length > 0 ? mergedQuery : undefined
    }

    // Call the base class's request method
    return super.request<T>(modifiedOptions)
  }
}
