import { v4 as uuid4 } from "uuid";

export type User =
    | { kind: "admin" }
    | { kind: "user", user: string }
    | { kind: "none" }
    ;

export class AuthManager {
    private credentials: Map<string, string> = new Map([["zwade", "whoami"]]);
    private tokens: Map<string, string> = new Map();

    public register(user: string, password: string) {
        if (this.credentials.has(user)) {
            throw new Error("User already exists");
        }

        this.credentials.set(user, password);
    }

    public login(user: string, password: string) {
        const correctPassword = this.credentials.get(user);
        return correctPassword !== undefined && correctPassword === password;
    }

    public userFromToken(token: string) {
        return this.tokens.get(token);
    }

    public createToken(user: string) {
        const uuid = uuid4();
        this.tokens.set(uuid, user);
        return uuid;
    }
}