import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt"
import * as dotenv from 'dotenv'

dotenv.config()

export class UserStrategy extends PassportStrategy(Strategy, 'user') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.USER_SECRET,
        })
    }

    async validate(payload: any) {
        return {
            id: payload.id,
            phone: payload.phone
        }
    }
}