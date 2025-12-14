import express, {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const router = express.Router();

interface LoginRequest {
    email: string;
    password: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

router.post('/login', async (req: Request, res: Response) => {
    try {
        const {email, password}: LoginRequest = req.body;

        // 입력 검증
        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요.'
            });
        }

        // 사용자 조회
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email] 
        ) as [any[], any];

        if(users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const user = users[0];

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            JWT_SECRET,
            {expiresIn: '24h'}
        );

        res.status(200).json({
            success: true,
            message: '로그인 성공',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }catch(error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '서버 오류가 발생했습니다.'
        });
    }
});

export default router;