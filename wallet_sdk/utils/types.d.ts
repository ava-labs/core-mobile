export declare type AvmStatusType = 'Accepted' | 'Processing' | 'Rejected' | 'Unknown';
export declare type PlatformStatusType = 'Committed' | 'Processing' | 'Dropped' | 'Unknown';
export declare type AvmStatusResponseType = AvmStatusType | iAvmStatusResponse;
export declare type PlatformStatusResponseType = PlatformStatusType | iPlatformStatusResponse;
export interface iAvmStatusResponse {
    status: AvmStatusType;
    reason: string;
}
export interface iPlatformStatusResponse {
    status: PlatformStatusType;
    reason: string;
}
