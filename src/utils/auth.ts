import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

export interface UserData {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    role?: string;
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side client used only to validate incoming access tokens against
// Supabase Auth. It holds no session of its own; the token is passed per call.
const authClient: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey, {
              auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

/**
 * Verify a Supabase access token and return the user data.
 *
 * The token's signature, expiry and revocation status are validated by
 * Supabase Auth (`GET /auth/v1/user`), so a forged or expired token is
 * rejected instead of being trusted from its decoded claims.
 *
 * @param authorization - Authorization header value (with or without `Bearer `)
 * @returns User data resolved from the verified token
 * @throws AuthError If the token is missing, invalid, expired or revoked
 */
export const verifyAuth = async (
    authorization: string | undefined
): Promise<UserData> => {
    if (!authorization) {
        throw new AuthError('No authorization header');
    }

    if (!authClient) {
        throw new AuthError('Auth is not configured', 500);
    }

    // Remove 'Bearer ' prefix if present
    let token = authorization;
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }

    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) {
        throw new AuthError('Invalid token');
    }

    const user = data.user;
    if (!user.id || !user.email) {
        throw new AuthError('Invalid token: missing required claims');
    }

    const metadata = (user.user_metadata ?? {}) as UserMetadata;

    return {
        id: user.id,
        email: user.email,
        name: metadata.name ?? metadata.full_name,
        avatar_url: metadata.avatar_url ?? metadata.picture,
        role: user.role,
    };
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
            let authToken = req.headers.authorization;

            if (!authToken || authToken.length === 0) {
                try {
                    const authTokenCookie = req.cookies['sb-uihahglfncxadigplxnw-auth-token'];
                    const token = JSON.parse(authTokenCookie)[0];
                    authToken = token;
                } catch (error) {
                    console.log("authToken error", error);
                }
            }

            if (!authToken) {
                throw new AuthError('No authorization header');
            }

            if (authToken.startsWith('Bearer ')) {
                authToken = authToken.slice(7);
            }

            const userData = await verifyAuth(authToken);
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
