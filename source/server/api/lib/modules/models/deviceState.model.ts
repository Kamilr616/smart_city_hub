export interface IDeviceState {
   deviceId:  number;
    states: Array<{
        state: boolean;
        timestamp: Date;
    }>;
}

export type Query<T> = {
    [key: string]: T;
};
