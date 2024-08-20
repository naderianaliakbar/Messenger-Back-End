// init app and plugins
import express         from 'express';
import path            from 'path';
import cookieParser    from 'cookie-parser';
import helmet          from 'helmet';
import cors            from 'cors';
import {dirname}       from 'node:path';
import {fileURLToPath} from 'node:url';

// get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);


let app = express();

// add middlewares
app.use(helmet({crossOriginResourcePolicy: false}));
// app.use(logger('dev'));
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(process.env.STATICS_URL, express.static(path.join(__dirname, 'public')));
app.use(cors());

process.env.TZ = "Asia/Tehran";

import usersRouter         from './routes/users.js';
import authRouter          from './routes/auth.js';
import contactsRouter      from './routes/contacts.js';
import conversationsRouter from './routes/conversations.js';

// add routes
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/conversations', conversationsRouter);

export default app;
