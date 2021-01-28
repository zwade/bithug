import { toast } from "react-toastify";

import type { Commit, File } from "@bithug/server/dist/git";
import type { SerializedWebhook } from "@bithug/server/dist/webhooks";

export namespace Api {
    const post = async (path: string, data: object, suppressError?: boolean) => {
        const result = await fetch(path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
        });

        if (!result.ok && !suppressError) {
            const { error } = await result.json();
            toast.error(error);
            throw new Error(error);
        }

        return result;
    }

   const get = async (path: string, suppressError?: boolean) => {
        const result = await fetch(path, {
            method: "GET",
            credentials: "include",
        });

        if (!result.ok && !suppressError) {
            const { error } = await result.json();
            toast.error(error);
            throw new Error(error);
        }

        return result;
    }

    export namespace Web {
        export const login = async (user: string, password: string) => {
            const response = await post("/api/login", { user, password });
            return response.ok;
        }

        export const register = async (user: string, password: string) => {
            const response = await post("/api/register", { user, password });
            return response.ok;
        }

        export const self = async (): Promise<{ user: string, repos: { name: string, readme?: string }[] } | undefined> => {
            const response = await get("/api/self", true);
            if (!response.ok) {
                return undefined;
            }
            return response.json()
        }

        export const logout = async () => {
            await post("/api/logout", {});
            return true;
        }

        export const createRepo = async (name: string, initializeReadme: boolean): Promise<{ repo: string }> => {
            const response = await post("/api/repo/create", { name, initializeReadme });
            return response.json();
        }
    }

    export namespace Repo {
        export const commit = async (repo: string, ref: string = "refs/heads/master") => {
            const response = await get(`/${repo}.git/api/commit?ref=${encodeURIComponent(ref)}`, true);
            const result: { commit: Commit | undefined } = await response.json();
            return result.commit;
        }

        export const readme = async (repo: string, ref: string = "refs/heads/master") => {
            const response = await get(`/${repo}.git/api/readme?ref=${encodeURIComponent(ref)}`);
            const result: { readme: string | undefined } = await response.json();
            return result.readme;
        }

        export const tree = async (repo: string, tree: string) => {
            const response = await get(`/${repo}.git/api/tree?hash=${encodeURIComponent(tree)}`);
            const result: { tree: File[] | undefined } = await response.json();
            if (!result?.tree) {
                toast.error("Unable to fetch filesystem");
                throw new Error("Unable to fetch filesystem");
            }
            return result.tree;
        }

        export const blob = async (repo: string, blob: string) => {
            const response = await get(`/${repo}.git/api/blob?hash=${encodeURIComponent(blob)}`);
            const result: { blob: string } = await response.json();
            if (!result?.blob) {
                toast.error("Unable to fetch blob");
                throw new Error("Unable to fetch blob");
            }
            return result.blob;
        }

        export const webhooks = async (repo: string) => {
            const response = await get(`/${repo}.git/webhooks`);
            const result: SerializedWebhook[] = await response.json();
            return result;
        }

        export const access = async (repo: string) => {
            const response = await get(`/${repo}.git/access`);
            const result: { users: string[] | undefined } = await response.json();
            return result.users;
        }

        export const createWebhook = async (repo: string, url: string, rawBody: string, contentType: string) => {
            const response = await post(`/${repo}.git/webhooks`, { url, body: btoa(rawBody), contentType });
            return response.ok;
        }
    }
}