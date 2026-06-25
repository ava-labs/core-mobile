/**
 * Prefix shared by every error the CCT callbacks throw. The swap error mapper
 * (`getSwapErrorMessage`) matches on this tag to surface a clear, user-facing
 * message instead of the raw internal guard string. Keep producer
 * (`createCctCallbacks`) and consumer (`fusionErrors`) in sync via this const.
 */
export const CCT_CALLBACKS_ERROR_TAG = '[cctCallbacks]'
