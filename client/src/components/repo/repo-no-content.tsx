import * as React from "react";
import { UserContext } from "../../providers/user-provider";
import { Code } from "../code";
import { Frame } from "../frame";
import { getRepoUri } from "./utils";

export interface Props {
    repo: string;
}

export const RepoNoContent = (props: Props) => {
    const repoName = props.repo.split("/")[1];
    const repoHref = getRepoUri(props.repo);

    return (
        <div className="bh-repo no-content">
            <Frame>
                <div className="title">{ props.repo }</div>
                <div>
                    This repo is still empty, but you can start adding files with just a few commands.
                </div>
                <Code>
                    {
`git clone ${repoHref}
cd ${repoName}

echo "Hello world" > README.md

git add -A
git commit -m "Initial commit"
git push origin master`
                    }
                </Code>
            </Frame>
        </div>
    )
}