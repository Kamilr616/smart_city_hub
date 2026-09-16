import Controller from '../interfaces/controller.interface';
import {Request, Response, Router} from 'express';
import Joi from 'joi';
import {auth} from '../middlewares/auth.middleware';
import {admin} from '../middlewares/admin.middleware';
import UserService, {publicUser, UserManagementError} from '../modules/services/user.service';
import PasswordService from '../modules/services/password.service';
import TokenService from '../modules/services/token.service';

const fields = {
    name: Joi.string().trim().min(1).max(100),
    email: Joi.string().trim().email().max(254),
    role: Joi.string().trim().min(1).max(100),
    isAdmin: Joi.boolean().strict(), active: Joi.boolean().strict(),
    password: Joi.string().min(12).max(72).custom((value, helpers) => Buffer.byteLength(value, 'utf8') <= 72 ? value : helpers.error('string.max', {limit: 72}))
};
const patchSchema = Joi.object(fields).min(1).unknown(false);
const createSchema = Joi.object({...fields,
    name: fields.name.required(), email: fields.email.required(), password: fields.password.required()
}).unknown(false);

class UserController implements Controller {
    public path = '/api/user';
    public router = Router();
    private userService = new UserService();
    private passwordService = new PasswordService();
    private tokenService = new TokenService();
    constructor() {
        this.router.use(this.path, (_request, response, next) => { response.set('Cache-Control', 'no-store'); next(); });
        this.router.get(`${this.path}/list`, admin, this.list);
        this.router.patch(`${this.path}/:id`, admin, this.update);
        this.router.post(`${this.path}/create`, admin, this.create);
        this.router.post(`${this.path}/auth`, this.authenticate);
        this.router.delete(`${this.path}/logout`, auth, this.removeHashSession);
    }
    private handleError(response: Response, error: any) {
        if (error instanceof UserManagementError) return response.status(error.status).json({error: error.message});
        if (error?.isJoi || error?.name === 'ValidationError') return response.status(400).json({error: 'Invalid input data.'});
        if (error?.code === 11000) return response.status(409).json({error: 'Name or email is already in use.'});
        return response.status(500).json({error: 'Internal Server Error'});
    }
    private list = async (_request: Request, response: Response) => {
        try { return response.status(200).json(await this.userService.list()); }
        catch (error) { return this.handleError(response, error); }
    };
    private update = async (request: Request, response: Response) => {
        const {id} = request.params;
        if (!/^[a-f\d]{24}$/i.test(id)) return response.status(400).json({error: 'Invalid user ID.'});
        try {
            const {password, ...changes} = await patchSchema.validateAsync(request.body);
            const hash = password === undefined ? undefined : await this.passwordService.hashPassword(password);
            const user = await this.userService.update(id, changes, response.locals.userId, hash);
            return response.status(200).json(publicUser(user));
        } catch (error) { return this.handleError(response, error); }
    };
    private create = async (request: Request, response: Response) => {
        try {
            const {password, ...data} = await createSchema.validateAsync(request.body);
            const hash = await this.passwordService.hashPassword(password);
            const user = await this.userService.create(data, hash);
            return response.status(200).json(publicUser(user));
        } catch (error) { return this.handleError(response, error); }
    };
    private authenticate = async (request: Request, response: Response) => {
        const {login, password} = request.body || {};
        if (typeof login !== 'string' || !login.trim() || typeof password !== 'string') {
            return response.status(400).json({error: 'Login and password are required.'});
        }
        try {
            const user = await this.userService.getByEmailOrName(login);
            if (!user || user.active === false || !await this.passwordService.authorize(user.id, password)) {
                return response.status(401).json({error: 'Unauthorized'});
            }
            const token = await this.tokenService.create(user);
            return response.status(200).json(this.tokenService.getToken(token));
        } catch (error) { return this.handleError(response, error); }
    };
    private removeHashSession = async (_request: Request, response: Response) => {
        try { return response.status(200).send(await this.tokenService.remove(response.locals.authToken)); }
        catch (error) { return this.handleError(response, error); }
    };
}
export default UserController;
