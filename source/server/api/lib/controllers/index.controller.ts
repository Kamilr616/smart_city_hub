import Controller from '../interfaces/controller.interface';
import {Request, Response, Router} from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Candidate locations for the landing page, in priority order: next to the
 * running module (`ts-node` uses `lib/public`, the build output uses
 * `dist/public`) and then relative to the working directory, which is what a
 * serverless bundle sees when `__dirname` no longer mirrors the repository.
 */
const INDEX_PAGE_CANDIDATES = [
    path.join(__dirname, '..', 'public', 'index.html'),
    path.join(process.cwd(), 'dist', 'public', 'index.html'),
    path.join(process.cwd(), 'lib', 'public', 'index.html'),
    path.join(process.cwd(), 'public', 'index.html')
];

const resolveIndexPage = (): string => {
    const existing = INDEX_PAGE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
    return existing || INDEX_PAGE_CANDIDATES[0];
};

class IndexController implements Controller {
   public path = '/';
   public router = Router();

   constructor() {
       this.initializeRoutes();
   }

   private initializeRoutes() {
       this.router.get(this.path, this.serveIndex);
   }

   private serveIndex = async (request: Request, response: Response) => {
       response.sendFile(resolveIndexPage());
   }
}

export default IndexController;
