import { Response } from "express";
import * as path from "path";
import * as child_process from "child_process";

export interface Commit {
    parents: string[];
    tree: string;
    author: string;
    message: string;
}

export interface File {
    name: string;
    hash: string;
    type: "tree" | "blob";
    mode: "file" | "dir";
}

export class GitManager {
    private repo;
    private dir;

    constructor(repo: string) {
        this.repo = repo;
        this.dir = path.join(__dirname, "../repos", repo);
    }

    private git(subcommand: string, args: string[] = [], stdin: string | Buffer | undefined = undefined) {
        return new Promise<Buffer>((resolve, reject) => {
            const proc = child_process.spawn("git", [subcommand, ...args], { cwd: this.dir });
            if (stdin) {
                proc.stdin.write(stdin);
            }

            let result = Buffer.from([]);
            proc.stdout.on("data", (data) => { result = Buffer.concat([result, Buffer.from(data)]) });
            proc.stdout.on("error", (err) => reject(err));
            proc.stdout.on("close", () => resolve(result));
        })
    }

    public async resolveRef(ref: string) {
        if (ref.match(/^[a-zA-Z0-9]{40}$/)) {
            return ref;
        }

        if (!ref.match(/^[a-zA-Z_\-\/]+$/)) {
           return undefined
        }

        const results = await this.git("show-ref", ["--", ref]);
        for (let line of results.toString().split("\n")) {
            const [commit, foundRef] = line.split(/\s+/);
            if (ref === foundRef) {
                return commit;
            }
        }

        return undefined
    }

    public async assertType(hash: string, type: "commit" | "blob" | "tree") {
        if (!hash.match(/^[a-fA-F0-9]{40}$/)) {
            throw new Error(`Invalid ${type}: ${hash}`);
        }

        const foundType = await this.git("cat-file", ["-t", hash]);
        if (foundType.toString().trim() !== type) {
            throw new Error(`Invalid ${type}: ${hash}`);
        }
    }

    public async getCommit(hash: string): Promise<Commit | undefined> {
        await this.assertType(hash, "commit");

        const results = await this.git("cat-file", ["-p", hash]);
        const [head, message] = results.toString().split("\n\n");
        const headerMap = new Map<string, string[]>();
        for (let line of head.split("\n")) {
            const [attr, ...value] = line.split(" ");
            headerMap.set(attr, (headerMap.get(attr) ?? []).concat(value.join(" ")));
        }

        if (headerMap.get("tree") === undefined) {
            return undefined;
        }

        return {
            parents: headerMap.get("parent") ?? [],
            author: headerMap.get("author")?.[0] ?? "No author",
            tree: headerMap.get("tree")![0],
            message,
        }
    }

    public async getTree(hash: string) {
        await this.assertType(hash, "tree");

        const result = await this.git("cat-file", ["-p", hash]);
        const files = [] as File[];
        for (let line of result.toString().split("\n")) {
            const match = /^([0-7]{6})\s+(\w+)\s+(\w{40})\s+(\w+)$/.exec(line);
            if (match) {
                const isDirectory = !!(parseInt("040000", 8) & parseInt(match[1], 8));
                files.push({
                    mode: isDirectory ? "dir" : "file",
                    type: match[2] as "blob" | "tree",
                    hash: match[3],
                    name: match[4],
                });
            }
        }

        return files;
    }

    public async getBlob(hash: string) {
        await this.assertType(hash, "blob");

        const result = await this.git("cat-file", ["-p", hash]);
        return result.toString();
    }

    public async uploadPackGet(res: Response) {
        res.status(200);
        res.header("content-type", "application/x-git-upload-pack-advertisement")
        res.write("001e# service=git-upload-pack\n");
        res.write("0000");
        const results = await this.git("upload-pack", ["--advertise-refs", this.dir]);
        res.write(results);
        res.end();
    }

    public async uploadPackPost(res: Response, data: Buffer) {
        const results = await this.git("upload-pack", ["--stateless-rpc", this.dir], data);
        res.write(results);
        res.end();
    }


    public async receivePackGet(res: Response) {
        res.status(200);
        res.header("content-type", "application/x-git-receive-pack-advertisement")
        res.write("001f# service=git-receive-pack\n");
        res.write("0000");
        const results = await this.git("receive-pack", ["--advertise-refs", this.dir]);
        res.write(results);
        res.end();
    }

    public async receivePackPost(res: Response, data: Buffer) {
        const results = await this.git("receive-pack", ["--stateless-rpc", this.dir], data);
        const lines = results.toString().split("\n")
        for (let line of lines) {
            if (!line.startsWith("0000")) {
                res.write(line + "\n");
            } else {
                const band = line[8]
                const ref = line.slice(9).trim();
                res.write("0000");
                if (ref.startsWith("refs/heads/")) {
                    const branchName = ref.slice("refs/heads/".length);
                    this.writeLine(res, `${band}Branch ${branchName} updated!`)
                }
                res.write("0000")
                res.end();
                return ref;
            }
        }
        res.end();
        return "unknown";
    }

    public writeLine(res: Response, data: string) {
        const length = 4 + data.length + 1;
        const prefix = length.toString(16).padStart(4, "0");
        res.write(prefix + data + "\n");
    }
}