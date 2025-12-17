import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

export interface AuthRequest extends Request {
    userId?: number;
    userEmail?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; //Bearer TOKEN

    if(!token) {
        return res.status(401).json({
            success: false,
            message: '인증 토큰이 필요합니다.'
        });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if(err) {
            return res.status(403).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }

        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    });
};