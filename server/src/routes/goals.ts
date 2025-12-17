import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 목표 목록 조회 (특정 날짜, 현재 사용자)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증 정보가 없습니다.'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: '날짜가 필요합니다.'
      });
    }

    const [goals] = await pool.execute(
      `SELECT id, user_id as userId, title, date, is_completed as isCompleted, completed_at as completedAt
       FROM goals
       WHERE user_id = ? AND date = ?
       ORDER BY created_at ASC`,
      [userId, date]
    ) as [any[], any];

    res.status(200).json({
      success: true,
      goals
    });
  } catch (error: any) {
    console.error('목표 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 목표 추가
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, date } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증 정보가 없습니다.'
      });
    }

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: '목표 내용과 날짜를 입력해주세요.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO goals (user_id, title, date) VALUES (?, ?, ?)',
      [userId, title, date]
    ) as [any, any];

    res.status(200).json({
      success: true,
      message: '목표가 추가되었습니다.',
      goalId: result.insertId
    });
  } catch (error: any) {
    console.error('목표 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 목표 달성 처리
router.patch('/:id/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '인증 정보가 없습니다.'
      });
    }

    // 본인 목표인지 확인
    const [goals] = await pool.execute(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as [any[], any];

    if (goals.length === 0) {
      return res.status(403).json({
        success: false,
        message: '목표에 대한 권한이 없습니다.'
      });
    }

    await pool.execute(
      'UPDATE goals SET is_completed = 1, completed_at = NOW() WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: '목표가 달성 처리되었습니다.'
    });
  } catch (error: any) {
    console.error('목표 달성 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

export default router;


