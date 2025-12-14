import express, {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';

const router = express.Router();

interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}

router.post('/signup', async (req: Request, res: Response) => {
    try {
        const {name, email, password}: SignUpRequest = req.body;

        // 입력 검증
        if(!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: '모든 필드를 입력해주세요.'
            });
        }

        // 이메일 중복 확인
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        ) as [any[], any];

        if(Array.isArray(existingUsers) && existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        // 비밀번호 해싱
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 사용자 저장
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?,?,?)',
            [name, email, hashedPassword]
        ) as [any, any];

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            userId: (result as any).insertId
        });
    }catch(error: any) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '서버 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
});

export default router;