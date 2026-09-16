import express from 'express';
import {config} from './config';
import Controller from "./interfaces/controller.interface";
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import {connectToDatabase} from './database';

class App {
    public app: express.Application;

    constructor(controllers: Controller[]) {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
    }

    private initializeMiddlewares(): void {
        this.app.use(bodyParser.json());
        this.app.use(morgan('dev'));
        this.app.use(cors({
            origin: config.corsOrigins,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            optionsSuccessStatus: 204,
            allowedHeaders: 'Content-Type,Authorization,x-access-token',
        }));
        // CORS answers preflight before any connection attempt.
        this.app.use('/api', async (_request, response, next) => {
            try {
                await connectToDatabase();
            } catch {
                console.error('MongoDB connection unavailable');
                response.status(503).json({error: 'Database unavailable'});
                return;
            }
            next();
        });
    }

    private initializeControllers(controllers: Controller[]): void {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }
}

export default App;