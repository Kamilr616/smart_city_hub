export interface IDevice {
    location: string;
    deviceId: number;
    name?: string;
    type?: string;
    description?: string;
    editDate?: Date;
}

export type Query<T> = {
    [key: string]: T;
};
