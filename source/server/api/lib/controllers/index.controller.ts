import Controller from '../interfaces/controller.interface';
import {Request, Response, Router} from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Candidate locations for the landing page, in priority order: next to the
 * running module (`ts-node` uses `lib/public`, the build output uses
 * `dist/public`) and then relative to the working directory. The
 * `lib/public` entry is the one a Vercel bundle sees, because `vercel.json`
 * traces `lib/public/**` into the function with `includeFiles` — the tracer
 * cannot follow a path handed to `res.sendFile()`.
 */
const INDEX_PAGE_CANDIDATES = [
    path.join(__dirname, '..', 'public', 'index.html'),
    path.join(process.cwd(), 'lib', 'public', 'index.html'),
    path.join(process.cwd(), 'dist', 'public', 'index.html'),
    path.join(process.cwd(), 'public', 'index.html')
];

let resolvedIndexPage: string | undefined;

const resolveIndexPage = (): string => {
    if (resolvedIndexPage) {
        return resolvedIndexPage;
    }
    const existing = INDEX_PAGE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
    if (!existing) {
        // Nothing to memoise yet; keep probing so a later deployment layout is
        // still picked up, and fail the way the original single path did.
        return INDEX_PAGE_CANDIDATES[0];
    }
    resolvedIndexPage = existing;
    return resolvedIndexPage;
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
