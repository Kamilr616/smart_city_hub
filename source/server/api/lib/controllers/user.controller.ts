import Controller from '../interfaces/controller.interface';
import {Request, Response, NextFunction, Router} from 'express';
import {auth} from '../middlewares/auth.middleware';
//import {admin} from '../middlewares/admin.middleware';
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
        this.router.post(`${this.path}/create`, this.createNewOrUpdate); //TODO admin
        this.router.post(`${this.path}/auth`, this.authenticate); //
        this.router.delete(`${this.path}/logout/:userId`, auth, this.removeHashSession);
    }

    private authenticate = async (request: Request, response: Response, next: NextFunction) => {
        const {login, password} = request.body;

        try {
            const user = await this.userService.getByEmailOrName(login);
            if (!user) {
                response.status(401).json({error: 'Unauthorized'});
            }
// @ts-ignore
            await this.passwordService.authorize(user.id, await this.passwordService.hashPassword(password));
            const token = await this.tokenService.create(user);
            response.status(200).json(this.tokenService.getToken(token));
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(401).json({error: 'Unauthorized'});
        }
    };

    private createNewOrUpdate = async (request: Request, response: Response, next: NextFunction) => {
        const userData = request.body;
        try {
            const user = await this.userService.createNewOrUpdate(userData);
            if (userData.password) {
                const hashedPassword = await this.passwordService.hashPassword(userData.password)
                await this.passwordService.createOrUpdate({
                    // @ts-ignore
                    userId: user._id,
                    password: hashedPassword
                });
            }
            response.status(200).json(user);
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            // @ts-ignore
            response.status(400).json({error: 'Bad request', value: error.message});
        }

    };

    private removeHashSession = async (request: Request, response: Response, next: NextFunction) => {
        const {userId} = request.params

        try {
            const result = await this.tokenService.remove(userId);
            response.status(200).send(result);
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(401).json({error: 'Unauthorized'});
        }
    };
}

export default UserController;
