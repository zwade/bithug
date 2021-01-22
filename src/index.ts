import express from "express";
import cookieParser from "cookie-parser";

import gitRouter from "./git-api";
import authRouter from "./auth-api";
import { GitManager } from "./git";
import { User } from "./auth";

declare global {
    export namespace Express {
        export interface Request {
            git: GitManager;
            hash: string;
            user: User;
        }
    }
}

const main = async () => {
    const app = express();

    app.use(cookieParser());
    app.use("/", (req, res, next) => {
        console.log(req.method, req.url, req.query);
        next();
    });

    app.use("/", authRouter);
    app.use("/", gitRouter);
    app.listen(1823);
}

main()