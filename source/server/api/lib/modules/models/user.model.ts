export interface IUser {
    _id: string;
    email: string;
    name: string;
    role?: string;
    active?: boolean;
    isAdmin?: boolean;
}
