import * as React from "react";
import { Api } from "../../client";

import { RepoContext } from "../../providers/repo-provider";
import { UserContext } from "../../providers/user-provider";
import { Button } from "../button";
import { Code } from "../code";
import { Frame } from "../frame";
import { Input, TextArea } from "../input";
import { Radio } from "../radio";
import { getRepoUri } from "./utils";

const defaultBody = `{
    "branch": "{{branch}}",
    "user": "{{user}}"
}`;

type ContentTypes = "application/json" | "text/plain";

export const RepoSettings = () => {
    const { data } = React.useContext(UserContext);
    const { state, refreshWebhooks } = React.useContext(RepoContext);
    const [webhookUrl, setWebhookUrl] = React.useState("");
    const [webhookBody, setWebhookBody] = React.useState(defaultBody);
    const [contentType, setContentType] = React.useState<ContentTypes>("application/json");

    const radioOptions = [{ label: "JSON", value: "application/json" }, { label: "Plain Text", value: "text/plain" }] as const;

    const createWebhook = async () => {
        await Api.Repo.createWebhook(state.repo, webhookUrl, webhookBody, contentType);
        refreshWebhooks();
        setWebhookUrl("");
        setWebhookBody(defaultBody);
        setContentType("application/json");
    };

    return (
        <div className="bh-repo-settings">
            <Frame>
                <div className="title">Basic Information</div>

                <div className="frame-label">Name</div>
                <Input disabled value={state.repo.split("/")[1]}/>

                <div className="frame-label">Url</div>
                <Input disabled value={getRepoUri(data?.user ?? "", state.repo)}/>
            </Frame>
            <Frame>
                <div className="title">Webhooks</div>

                {
                    state.webhooks.length > 0
                        ? <div className="frame-label">Active Webhooks</div>
                        : undefined
                }
                {
                    state.webhooks.map((url) =>
                        <Code>{ url }</Code>
                    )
                }

                <div className="frame-label">New Webhook</div>
                <Input placeholder="Webhook Url" value={webhookUrl} onChange={setWebhookUrl}/>
                <TextArea placeholder="Webhook Body" value={webhookBody} onChange={setWebhookBody}/>
                <Radio
                    options={radioOptions}
                    value={contentType}
                    onChange={(value) => { setContentType(value), setWebhookBody("") }}
                />
                <Button label={"Register Webhook"} onClick={createWebhook}/>
            </Frame>
        </div>
    )
}