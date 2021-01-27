import * as sqlite from "sqlite3";

export interface Webhook {
    repo: string;
    user: string;
    url: string;
    contentType: string;
    body: Buffer;
}

export type SerializedWebhook = Omit<Webhook, "body"> & { body: string };

export class WebhookManager {
    private db;

    constructor() {
        this.db = new sqlite.Database("./webhooks.sqlite");
        this.db.run("CREATE TABLE IF NOT EXISTS webhooks (repo varchar, user varchar, url varchar, contentType varchar, body varchar);");
    }

    public async getWebhooksForRepo(repo: string) {
        return new Promise<Webhook[]>((resolve, reject) => {
            const statement = this.db.prepare("SELECT * FROM webhooks WHERE repo = ?");
            statement.all(repo, (err, rows) => {
                return resolve(rows.map(({ repo, user, url, body, contentType }) => ({ repo, user, url, body, contentType })));
            });
        });
    }

    public async getWebhooksForUser(repo: string, user: string) {
        return new Promise<Webhook[]>((resolve, reject) => {
            const statement = this.db.prepare("SELECT * FROM webhooks WHERE repo = ? AND user = ?");
            statement.all(repo, user, (err: any, rows: any[]) => {
                return resolve(rows.map(({ repo, user, url, body, contentType }) => ({ repo, user, url, body, contentType })));
            });
        });
    }

    public async addWebhook(repo: string, user: string, url: string, contentType: string, body: Buffer) {
        return new Promise<void>((resolve, reject) => {
            const statement = this.db.prepare("INSERT INTO webhooks (repo, user, url, contentType, body) VALUES (?, ?, ?, ?, ?)");
            statement.run(repo, user, url, contentType, body, () => {
                resolve();
            });
        });
    }
}

export const webhookManager = new WebhookManager();