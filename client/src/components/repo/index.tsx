import * as React from "react";
import { useParams } from "react-router";
import { RepoProvider } from "../../providers/repo-provider";

import { Nav } from "../nav";
import { RepoContent } from "./repo-content";
import { RepoNoContent } from "./repo-no-content";
import { Tabs } from "../tabs";
import { RepoSettings } from "./repo-settings";

import "./index.scss";

const _Repo = () => {
    const [tab, setTab] = React.useState<"Code" | "Settings">("Code");
    return (
        <div className="bh-repo-container">
            <Tabs currentTab={tab} onChange={setTab} options={["Code", "Settings"]}/>
            { tab === "Code" ? <RepoContent/> : <RepoSettings/> }
        </div>
    )
}

export const Repo = () => {
    const { user, name, 0: path } = useParams<{ user: string; name: string, 0?: string }>();
    const repo = `${user}/${name}`;
    return (
        <>
            <Nav/>
            <RepoProvider
                repo={repo}
                initialPath={path?.split("/")}
                noCommits={<RepoNoContent repo={repo}/>}
            >
                <_Repo/>
            </RepoProvider>
        </>
    );
}