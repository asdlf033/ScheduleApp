import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 업로드 디렉토리 생성
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// 할일 목록 조회
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: '날짜가 필요합니다.'
      });
    }

    // 해당 날짜의 현재 로그인한 사용자의 할일만 조회
    const userId = req.userId;
    const [todos] = await pool.execute(
      `SELECT t.id, t.content, t.date, t.image_url as imageUrl, t.user_id as userId, u.name as userName
       FROM todos t
       JOIN users u ON t.user_id = u.id
       WHERE t.date = ? AND t.user_id = ?
       ORDER BY t.created_at DESC`,
      [date, userId]
    ) as [any[], any];

    res.status(200).json({
      success: true,
      todos: todos
    });
  } catch (error: any) {
    console.error('할일 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 할일 추가 (이미지 포함)
router.post('/', authenticateToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { content, date } = req.body;
    const userId = req.userId;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: '날짜를 입력해주세요.'
      });
    }

    if (!content && !req.file) {
      return res.status(400).json({
        success: false,
        message: '내용 또는 이미지를 입력해주세요.'
      });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.execute(
      'INSERT INTO todos (user_id, content, date, image_url) VALUES (?, ?, ?, ?)',
      [userId, content || '', date, imageUrl]
    ) as [any, any];

    res.status(200).json({
      success: true,
      message: '할일이 추가되었습니다.',
      todoId: result.insertId
    });
  } catch (error: any) {
    console.error('할일 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 할일 수정 (이미지 포함)
router.patch('/:id', authenticateToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    // 본인의 할일만 수정 가능
    const [todos] = await pool.execute(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as [any[], any];

    if (todos.length === 0) {
      return res.status(403).json({
        success: false,
        message: '수정 권한이 없습니다.'
      });
    }

    const todo = todos[0];
    let imageUrl = todo.image_url;

    // 새 이미지가 업로드되면 기존 이미지 삭제하고 새 이미지 사용
    if (req.file) {
      // 기존 이미지 파일 삭제
      if (todo.image_url) {
        const oldImagePath = path.join(__dirname, '../../', todo.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // 내용 업데이트
    await pool.execute(
      'UPDATE todos SET content = ?, image_url = ? WHERE id = ?',
      [content || todo.content, imageUrl, id]
    );

    res.status(200).json({
      success: true,
      message: '할일이 수정되었습니다.'
    });
  } catch (error: any) {
    console.error('할일 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 할일 삭제
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 본인의 할일만 삭제 가능
    const [todos] = await pool.execute(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as [any[], any];

    if (todos.length === 0) {
      return res.status(403).json({
        success: false,
        message: '삭제 권한이 없습니다.'
      });
    }

    // 이미지 파일 삭제
    const todo = todos[0];
    if (todo.image_url) {
      const imagePath = path.join(__dirname, '../../', todo.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.execute('DELETE FROM todos WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: '할일이 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('할일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 피드 조회 (다른 사람들의 todo, 페이징)
router.get('/feed', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const userId = req.userId;

    // 전체 개수 조회 (본인의 todo 제외)
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM todos WHERE user_id != ?',
      [userId]
    ) as [any[], any];
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 할일 목록 조회 (최신순, 좋아요 개수 및 프로필 이미지 포함)
    // 본인의 todo는 제외하고 다른 사람들의 todo만 표시
    // 먼저 기본 todo 정보 조회
    // LIMIT와 OFFSET은 파라미터로 바인딩할 수 없으므로 직접 삽입 (SQL 인젝션 방지를 위해 숫자로 변환)
    const safeLimit = parseInt(limit.toString());
    const safeOffset = parseInt(offset.toString());
    const [todosData] = await pool.execute(
      `SELECT t.id, t.content, t.date, t.image_url as imageUrl, t.user_id as userId, 
              u.name as userName, u.profile_image_url as profileImageUrl,
              t.created_at as createdAt
       FROM todos t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id != ?
       ORDER BY t.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userId]
    ) as [any[], any];

    // 각 todo에 대해 좋아요 정보 추가
    const todos = await Promise.all(
      todosData.map(async (todo: any) => {
        try {
          // 좋아요 개수 조회
          const [likeCountResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM likes WHERE todo_id = ?',
            [todo.id]
          ) as [any[], any];
          const likeCount = likeCountResult[0]?.count || 0;

          // 현재 사용자가 좋아요를 눌렀는지 확인
          const [userLikeResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM likes WHERE todo_id = ? AND user_id = ?',
            [todo.id, userId]
          ) as [any[], any];
          const isLiked = (userLikeResult[0]?.count || 0) > 0;

          return {
            ...todo,
            likeCount: parseInt(likeCount.toString()),
            isLiked: isLiked
          };
        } catch (err) {
          console.error(`좋아요 정보 조회 오류 (todo_id: ${todo.id}):`, err);
          return {
            ...todo,
            likeCount: 0,
            isLiked: false
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      todos: todos,
      currentPage: page,
      totalPages: totalPages,
      total: total
    });
  } catch (error: any) {
    console.error('피드 조회 오류:', error.message);
    res.status(500).json({
      success: false,
      message: '피드를 불러오는 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

