export interface DecodedToken {
    user: {
        user: number | string;
        profile: { 
            id: number | string;
            type: string;
        };
        branch?: {
            id: number | string;
        }
    };
    iat: number;
    exp: number;
}