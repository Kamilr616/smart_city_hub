import {Request, Response, Router} from 'express';
import Joi from 'joi';
import Controller from '../interfaces/controller.interface';
import {admin} from '../middlewares/admin.middleware';
import EspTokenService from '../modules/services/espToken.service';

export default class EspTokenController implements Controller {
    public path = '/api/esp-tokens';
    public router = Router();
    private service = new EspTokenService();

    constructor() {
        this.router.get(this.path, admin, this.list);
        this.router.post(this.path, admin, this.create);
        this.router.delete(`${this.path}/:id`, admin, this.revoke);
    }

    private list = async (_request: Request, response: Response) => {
        response.setHeader('Cache-Control', 'no-store');
        try { response.json(await this.service.list()); }
        catch { response.status(503).json({error: 'ESP tokens unavailable.'}); }
    };

    private create = async (request: Request, response: Response) => {
        const {error, value} = Joi.object({
            name: Joi.string().trim().max(120).required(),
            location: Joi.string().trim().max(120).required(),
            expiresInDays: Joi.number().integer().min(1).max(365).strict().required()
        }).required().validate(request.body);
        if (error) {response.status(400).json({error: 'Provide a name, existing location and expiry of 1 to 365 days.'}); return;}
        response.setHeader('Cache-Control', 'no-store');
        try { response.status(201).json(await this.service.create(value)); }
        catch (error) {
            if ((error as {status?: number}).status === 400) response.status(400).json({error: 'Select an existing location.'});
            else response.status(503).json({error: 'Could not create ESP token.'});
        }
    };

    private revoke = async (request: Request, response: Response) => {
        if (!/^[a-f0-9]{24}$/i.test(request.params.id)) {response.status(400).json({error: 'Invalid token ID.'}); return;}
        try {
            const key = await this.service.revoke(request.params.id);
            if (!key) {response.status(404).json({error: 'ESP token not found.'}); return;}
            response.json(key);
        } catch { response.status(503).json({error: 'Could not revoke ESP token.'}); }
    };
}
