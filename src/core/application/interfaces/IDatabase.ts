export interface IDatabase {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(text: string, params?: any[]): Promise<any>;
    isConnected(): boolean;
}
