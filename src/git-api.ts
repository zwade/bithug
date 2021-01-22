import { Router } from "express";
import * as bodyParser from "body-parser";

import { GitManager } from "./git";

const router = Router();

router.use("/:user/:repo", async (req, res, next) => {
    if (req.user.kind === "none") {
        res.header("WWW-Authenticate", `Basic realm="Git credentials"`);
        res.status(401);
        return res.end();
    }
    return next();
})

router.use("/:user/:repo", async (req, res, next) => {
    console.log("Authenticated as ", req.user);

    const repoOwner = req.params.user;
    const repo = req.params.repo;
    if (!/^[a-zA-Z0-9_-]{3,}$/.exec(repoOwner) || !/^[a-zA-Z0-9_\-\.]{3,}$/.exec(repo)) {
        return res.status(404).end();
    }

    const user = req.user;
    if (user.kind === "none") { throw new Error("unreachable"); }

    if (user.kind === "admin" || user.user === repoOwner) {
        req.git = new GitManager(`${repoOwner}/${repo}`);
        return next();
    }

    const potentialRepo = new GitManager(`${repoOwner}/${repo}`);
    const configCommit = await potentialRepo.getCommit("refs/meta/config");
    if (!configCommit) {
        return res.status(404).end()
    }
    const configTree = await potentialRepo.getTree(configCommit.tree);
    const configFile = configTree?.find(({ name, mode }) => name === "access.conf" && mode === "file");
    if (!configFile) {
        return res.status(404).end()
    }
    const configBlob = await potentialRepo.getBlob(configFile.hash);
    if (!configBlob) {
        return res.status(404).end();
    }

    const foundUser = configBlob.split("\n").find((name) => name === user.user);
    if (!foundUser) {
        return res.status(404).end();
    }

    req.git = potentialRepo;
})

router.use("/:user/:repo/api", async (req, res, next) => {
    const ref = req.query.ref;
    if (typeof ref !== "string") {
        return res.send({});
    }

    const hash = await req.git.resolveRef(ref);
    if (!hash) {
        return res.send({});
    }

    req.hash = hash;
    next();
});

router.use("/:user/:repo/api/commit", async (req, res) => {
    const commit = await req.git.getCommit(req.hash);
    res.send({ commit });
});

router.use("/:user/:repo/api/tree", async (req, res) => {
    const tree = await req.git.getTree(req.hash);
    res.send({ tree });
});

router.use("/:user/:repo/api/blob", async (req, res) => {
    const blob = await req.git.getBlob(req.hash);
    res.send({ blob });
});

router.use("/:user/:repo/info/refs", (req, res) => {
    const service = req.query.service;
    if (service === "git-upload-pack") {
        req.git.uploadPackGet(res);
    } else if (service === "git-receive-pack") {
        req.git.receivePackGet(res);
    }
});

router.use("/:user/:repo/git-upload-pack", bodyParser.raw({ type: "application/x-git-upload-pack-request" }))
router.use("/:user/:repo/git-upload-pack", async (req, res) => {
    await req.git.uploadPackPost(res, req.body);
});

router.use("/:user/:repo/git-receive-pack", bodyParser.raw({ type: "application/x-git-receive-pack-request" }))
router.use("/:user/:repo/git-receive-pack", async (req, res) => {
    const ref = await req.git.receivePackPost(res, req.body);
    console.log("updated ref", ref);
});

export default router;