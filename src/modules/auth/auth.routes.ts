import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { refreshSchema, signInSchema, signUpSchema } from './auth.schema.js';

export const authRouter = Router();
authRouter.post('/sign-up', validate(signUpSchema), controller.signUp);
authRouter.post('/sign-in', validate(signInSchema), controller.signIn);
authRouter.post('/refresh', validate(refreshSchema), controller.refresh);
