import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiAuthRoutes from './routes/apiAuthRoutes.js';
import webAuthRoutes from './routes/webAuthRoutes.js';

const app = express();
dotenv.config();
const PORT = process.env.AUTH_PORT || 3000;

const allowedOriginPattern = new RegExp(process.env.ALLOWED_ORIGIN_PATTERN);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        console.log(process.env.ALLOWED_ORIGIN_PATTERN);
        if (allowedOriginPattern.test(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use('/', webAuthRoutes)
app.use('/auth', apiAuthRoutes);

app.listen(PORT, () => {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
        console.log(`Server running in development mode port ${PORT}`);
        console.log('');
        console.log('⚠️  WARNING ⚠️');
        console.log('If you are running multiple apps (e.g., auth and kanban) that need to share cookies:');
        console.log('- Make sure all apps use the same domain.');
        console.log('- Do not use "localhost" in cookies if the apps are on different ports.');
        console.log('- Edit your /etc/hosts file to map test domains to 127.0.0.1, for example:');
        console.log('    127.0.0.1 auth.<domain>.me:<port>');
        console.log('    127.0.0.1 kanban.<domain>.me:<port>');
        console.log('- Then access your apps using these domains in the browser so cookies can be shared correctly.');
        console.log('');
    }
});