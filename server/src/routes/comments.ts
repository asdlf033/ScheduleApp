import express, { Response } from 'express';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 댓글 조회
router.get('/todos/:todoId/comments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { todoId } = req.params;

    const [comments] = await pool.execute(
      `SELECT c.id, c.content, c.created_at as createdAt, c.user_id as userId,
              u.name as userName, u.profile_image_url as profileImageUrl
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.todo_id = ?
       ORDER BY c.created_at ASC`,
      [todoId]
    ) as [any[], any];

    res.status(200).json({
      success: true,
      comments: comments
    });
  } catch (error: any) {
    console.error('댓글 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 댓글 추가
router.post('/todos/:todoId/comments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { todoId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: '댓글 내용을 입력해주세요.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO comments (todo_id, user_id, content) VALUES (?, ?, ?)',
      [todoId, userId, content.trim()]
    ) as [any, any];

    // 추가된 댓글 정보 반환
    const [comments] = await pool.execute(
      `SELECT c.id, c.content, c.created_at as createdAt, c.user_id as userId,
              u.name as userName, u.profile_image_url as profileImageUrl
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    ) as [any[], any];

    res.status(200).json({
      success: true,
      message: '댓글이 추가되었습니다.',
      comment: comments[0]
    });
  } catch (error: any) {
    console.error('댓글 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 댓글 삭제
router.delete('/comments/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 본인의 댓글만 삭제 가능
    const [comments] = await pool.execute(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as [any[], any];

    if (comments.length === 0) {
      return res.status(403).json({
        success: false,
        message: '삭제 권한이 없습니다.'
      });
    }

    await pool.execute('DELETE FROM comments WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

export default router;

