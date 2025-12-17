import express, { Response } from 'express';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 좋아요 토글 (추가/삭제)
router.post('/todos/:todoId/like', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { todoId } = req.params;
    const userId = req.userId;

    // 이미 좋아요를 눌렀는지 확인
    const [existingLikes] = await pool.execute(
      'SELECT * FROM likes WHERE todo_id = ? AND user_id = ?',
      [todoId, userId]
    ) as [any[], any];

    if (existingLikes.length > 0) {
      // 좋아요 취소
      await pool.execute(
        'DELETE FROM likes WHERE todo_id = ? AND user_id = ?',
        [todoId, userId]
      );
      res.status(200).json({
        success: true,
        liked: false,
        message: '좋아요가 취소되었습니다.'
      });
    } else {
      // 좋아요 추가
      await pool.execute(
        'INSERT INTO likes (todo_id, user_id) VALUES (?, ?)',
        [todoId, userId]
      );
      res.status(200).json({
        success: true,
        liked: true,
        message: '좋아요가 추가되었습니다.'
      });
    }
  } catch (error: any) {
    console.error('좋아요 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 좋아요 개수 및 사용자 좋아요 여부 조회
router.get('/todos/:todoId/likes', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { todoId } = req.params;
    const userId = req.userId;

    // 좋아요 개수
    const [likeCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM likes WHERE todo_id = ?',
      [todoId]
    ) as [any[], any];

    // 현재 사용자가 좋아요를 눌렀는지 확인
    const [userLike] = await pool.execute(
      'SELECT * FROM likes WHERE todo_id = ? AND user_id = ?',
      [todoId, userId]
    ) as [any[], any];

    res.status(200).json({
      success: true,
      likeCount: likeCount[0]?.count || 0,
      isLiked: userLike.length > 0
    });
  } catch (error: any) {
    console.error('좋아요 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

export default router;

