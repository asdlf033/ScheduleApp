import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import signupRoutes from './routes/signup';
import loginRoutes from './routes/login';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// 라우트
app.use('/api/auth', signupRoutes);
app.use('/api/auth', loginRoutes);

// 기본 라우트
app.get('/', (req, res) => {
    res.json({message: 'Server is running'});
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});