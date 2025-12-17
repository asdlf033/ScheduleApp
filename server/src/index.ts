import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import signupRoutes from './routes/signup';
import loginRoutes from './routes/login';
import todosRoutes from './routes/todos';
import goalsRoutes from './routes/goals';
import commentsRoutes from './routes/comments';
import likesRoutes from './routes/likes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// 정적 파일 서빙 (업로드된 이미지)
app.use('/uploads', express.static('uploads'));

// 라우트
app.use('/api/auth', signupRoutes);
app.use('/api/auth', loginRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api', commentsRoutes);
app.use('/api', likesRoutes);

// 기본 라우트
app.get('/', (req, res) => {
    res.json({message: 'Server is running'});
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server accessible at:`);
    console.log(`  - http://localhost:${PORT}`);
    console.log(`  - http://0.0.0.0:${PORT}`);
});