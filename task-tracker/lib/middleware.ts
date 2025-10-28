import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - No token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const user = getUserFromToken(token);

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      // Attach user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;

      return handler(authenticatedReq);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

