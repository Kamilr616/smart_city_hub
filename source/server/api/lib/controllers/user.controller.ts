import Controller from '../interfaces/controller.interface';
import {Request, Response, NextFunction, Router} from 'express';
import {auth} from '../middlewares/auth.middleware';
import {admin} from '../middlewares/admin.middleware';
import UserService from "../modules/services/user.service";
import PasswordService from "../modules/services/password.service";
import TokenService from "../modules/services/token.service";

class UserController implements Controller {
    public path = '/api/user';
    public router = Router();
    private userService = new UserService();
    private passwordService = new PasswordService();
    private tokenService = new TokenService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/create`, admin, this.createNewOrUpdate);
        this.router.post(`${this.path}/auth`, this.authenticate);
        this.router.delete(`${this.path}/logout`, auth, this.removeHashSession);
    }

    private authenticate = async (request: Request, response: Response, next: NextFunction) => {
        const {login, password} = request.body;

        try {
            const user = await this.userService.getByEmailOrName(login);
            if (!user) {
                return response.status(401).json({error: 'Unauthorized'});
            }
            if (typeof password !== 'string' || !await this.passwordService.authorize(user.id, password)) {
                return response.status(401).json({error: 'Unauthorized'});
            }

            const token = await this.tokenService.create(user);
            return response.status(200).json(this.tokenService.getToken(token));
        } catch (error) {
        if (!response.headersSent) {
            console.error(`Error: ${error instanceof Error ? error.message : error}`);
            return response.status(500).json({ error: 'Internal Server Error' });
        }
        else {
            console.error(`Error: ${error instanceof Error ? error.message : error}`);
        }
        }
    };

    private createNewOrUpdate = async (request: Request, response: Response, next: NextFunction) => {
        const userData = request.body;
        try {
            const user = await this.userService.createNewOrUpdate(userData);
            if (!user) {
                return response.status(400).json({error: 'User could not be created'});
            }
            if (userData.password) {
                const hashedPassword = await this.passwordService.hashPassword(userData.password)
                await this.passwordService.createOrUpdate({
                    userId: user._id,
                    password: hashedPassword
                });
            }
            response.status(200).json(user);
        } catch (error) {
        if (!response.headersSent) {
            console.error(`Error: ${error instanceof Error ? error.message : error}`);
            return response.status(500).json({ error: 'Internal Server Error' });
        }
        else {
            console.error(`Error: ${error instanceof Error ? error.message : error}`);
        }
        }


    };

    private removeHashSession = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await this.tokenService.remove(response.locals.authToken);
            response.status(200).send(result);
        } catch (error) {
        if (!response.headersSent) {
            console.error(`Error: ${error instanceof Error ? error.message : error}`);
            return response.status(500).json({ error: 'Internal Server Error' });
        }
        else {
            console.error(`Error: ${error instanceof Error ? error.message : error}`);
        }
        }
    };
}

export default UserController;
