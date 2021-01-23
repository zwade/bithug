import { Router } from "express";
import * as bodyParser from "body-parser";

import { authManager } from "./auth";
import { webhookManager } from "./webhooks";
import { GitManager } from "./git";

const router = Router();

router.use("/api/login", bodyParser.json());
router.post("/api/login", async (req, res) => {
    const { user, password } = req.body;
    if (typeof user !== "string" || typeof password !== "string") {
        return res.status(400).end();
    }

    const success = await authManager.login(user, password);
    if (!success) {
        return res.status(401).end();
    }

    const token = await authManager.createToken(user);
    res.cookie("user-token", token);
    return res.send({});
});

router.use("/api/register", bodyParser.json());
router.post("/api/register", async (req, res) => {
    const { user, password } = req.body;
    if (typeof user !== "string"
        || !user.match(/^[a-zA-Z0-9-_]{3,}$/)
        || typeof password !== "string"
    ) {
        return res.status(400).end();
    }

    await authManager.register(user, password);
    const token = await authManager.createToken(user);
    res.cookie("user-token", token);

    // Every user gets their own target to attack. Please do not try to
    // attack someone else's target.
    const targetRepo = new GitManager(`_/${user}.git`);
    await targetRepo.create();
    await targetRepo.initializeReadme(`
## Super Secret Admin Repo

The flag is \`${process.env.FLAG ?? "picoCTF{this_is_a_test_flag}"}\`
`);
    return res.send({});
});

router.use("/api", (req, res, next) => {
    if (req.user.kind === "none") {
        return res.status(404).end();
    }
    next();
});

router.use("/api/repo/create", bodyParser.json());
router.post("/api/repo/create", async (req, res) => {
    const { name, initializeReadme } = req.body;
    if (req.user.kind !== "user"
        || typeof name !== "string"
        || !name.match(/^[a-zA-Z_-]{3,}$/)
    ) {
        throw new Error("Invalid repository");
    }

    const repo = new GitManager(`${req.user.user}/${name}.git`);
    await repo.create();
    if (initializeReadme) {
        await repo.initializeReadme(`# ${name}\n`);
    }
    res.send({});
})

export default router;