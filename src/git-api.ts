import { Router } from "express";
import * as bodyParser from "body-parser";
import fetch from "node-fetch";

import { GitManager } from "./git";
import { webhookManager } from "./webhooks";
import { formatString } from "./utils";

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
    const repoOwner = req.params.user;
    const repo = req.params.repo;
    if (!/^[a-zA-Z0-9_-]+$/.exec(repoOwner) || !/^[a-zA-Z0-9_\-\.]+$/.exec(repo)) {
        return res.status(404).end();
    }

    const user = req.user;
    if (user.kind === "none") { throw new Error("unreachable"); }

    if (user.kind === "admin" || user.user === repoOwner) {
        req.git = new GitManager(`${repoOwner}/${repo}`);
        return next();
    }

    const potentialRepo = new GitManager(`${repoOwner}/${repo}`);
    const hash = await potentialRepo.resolveRef("refs/meta/config");
    if (!hash) {
        return res.status(404).end();
    }
    const configCommit = await potentialRepo.getCommit(hash);
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
    return next();
})

router.use("/:user/:repo/webhooks", bodyParser.json());
router.get("/:user/:repo/webhooks", async (req, res) => {
    if (req.user.kind === "admin" || req.user.kind === "none") {
        return res.send({ webhooks: [] });
    }
    const webhooks = await webhookManager.getWebhooksForUser(req.git.repo, req.user.user);
    return res.send(webhooks.map((webhook) => ({ ...webhook, body: webhook.body.toString("base64") })));
});
router.post("/:user/:repo/webhooks", async (req, res) => {
    if (req.user.kind === "admin" || req.user.kind === "none") {
        return res.status(400).end();
    }

    const { url, body, contentType } = await req.body;
    const validationUrl = new URL(url);
    if (validationUrl.port !== "" && validationUrl.port !== "80") {
        throw new Error("Url must go to port 80");
    }
    if (validationUrl.host === "localhost" || validationUrl.host === "127.0.0.1") {
        throw new Error("Url must not go to localhost");
    }

    if (typeof contentType !== "string" || typeof body !== "string") {
        throw new Error("Bad arguments");
    }
    const trueBody = Buffer.from(body, "base64");

    await webhookManager.addWebhook(req.git.repo, req.user.user, url, contentType, trueBody);
    return res.send({});
});

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

router.get("/:user/:repo/info/refs", (req, res) => {
    const service = req.query.service;
    if (service === "git-upload-pack") {
        req.git.uploadPackGet(res);
    } else if (service === "git-receive-pack") {
        req.git.receivePackGet(res);
    }
});

router.use("/:user/:repo/git-upload-pack", bodyParser.raw({ type: "application/x-git-upload-pack-request" }))
router.post("/:user/:repo/git-upload-pack", async (req, res) => {
    await req.git.uploadPackPost(res, req.body);
});

router.use("/:user/:repo/git-receive-pack", bodyParser.raw({ type: "application/x-git-receive-pack-request" }))
router.post("/:user/:repo/git-receive-pack", async (req, res) => {
    const ref = await req.git.receivePackPost(res, req.body);
    const webhooks = await webhookManager.getWebhooksForRepo(req.git.repo);
    const options = {
        ref,
        branch: ref.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : undefined,
        user: req.user.kind === "user" ? req.user.user : undefined,
        repo: req.git.repo,
    };

    for (let webhook of webhooks) {
        const url =  formatString(webhook.url, options);
        const body = Buffer.from(formatString(webhook.body.toString("latin1"), options), "latin1");
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": webhook.contentType,
            },
            body,
        });
    }
});

export default router;