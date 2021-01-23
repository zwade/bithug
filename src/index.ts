import express from "express";
import cookieParser from "cookie-parser";
import "express-async-errors";

import gitRouter from "./git-api";
import authRouter from "./auth-api";
import webRouter from "./web-api";
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
    app.use("/", authRouter);
    app.use("/", (req, res, next) => {
        console.log(req.user, req.method, req.url, req.query);
        next();
    });

    app.use("/", webRouter);
    app.use("/", gitRouter);
    app.listen(1823);
}

process.on("unhandledRejection", (rejection) => {
    console.error("Unhandled promise rejection", rejection);
});

main()