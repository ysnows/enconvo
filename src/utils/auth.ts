import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

interface UserMetadata {
    name?: string;
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    picture?: string;
    provider_id?: string;
    full_name?: string;
    [key: string]: any;
}

interface JWTPayload extends jose.JWTPayload {
    email: string;
    phone: string;
    app_metadata: {
        provider: string;
        providers: string[];
    };
    user_metadata: UserMetadata;
    role: string;
    aal: string;
    amr: Array<{
        method: string;
        timestamp: number;
    }>;
    session_id: string;
    is_anonymous: boolean;
}

export interface UserData {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    role?: string;
    exp?: number;
    nbf?: number;
    [key: string]: any; // For any additional JWT claims
}

export interface AuthenticatedRequest extends NextApiRequest {
    user: UserData;
}

export class AuthError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 401) {
        super(message);
        this.name = 'AuthError';
        this.statusCode = statusCode;
    }
}

/**
 * Verify JWT token and return user data
 * @param authorization - Authorization header value
 * @returns User data from JWT
 * @throws AuthError If token is invalid or expired
 */
export const verifyAuth = (authorization: string | undefined): UserData => {
    if (!authorization) {
        throw new AuthError('No authorization header');
    }

    // Remove 'Bearer ' prefix if present
    let token = authorization;
    if (authorization.startsWith('Bearer ')) {
        token = authorization.slice(7);
    }

    try {
        const jwt = jose.decodeJwt(token) as JWTPayload;
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (jwt.exp && jwt.exp < currentTime) {
            throw new AuthError('Token expired');
        }

        // Check if token is not yet valid
        if (jwt.nbf && jwt.nbf > currentTime) {
            throw new AuthError('Token not yet valid');
        }

        // Extract and validate user data
        if (!jwt.sub || !jwt.email) {
            throw new AuthError('Invalid token: missing required claims');
        }

        const userData: UserData = {
            id: jwt.sub,
            email: jwt.email,
            name: jwt.user_metadata.name,
            avatar_url: jwt.user_metadata.avatar_url,
            role: jwt.role,
            exp: jwt.exp,
            nbf: jwt.nbf,
        };

        return userData;
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }
        throw new AuthError('Invalid token');
    }
};

type ApiHandler = (
    req: AuthenticatedRequest,
    res: NextApiResponse
) => Promise<void> | void;

/**
 * Middleware to verify authentication
 * @param handler - API route handler
 * @returns Wrapped handler with auth verification
 */
export const withAuth = (handler: ApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            const userData = verifyAuth(req.headers.authorization);
            (req as AuthenticatedRequest).user = userData;
            return await handler(req as AuthenticatedRequest, res);
        } catch (error) {
            if (error instanceof AuthError) {
                return res.status(error.statusCode).json({ 
                    error: error.message 
                });
            }
            return res.status(500).json({ 
                error: 'Internal server error' 
            });
        }
    };
};
