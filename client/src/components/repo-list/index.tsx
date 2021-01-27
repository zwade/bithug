import * as React from "react";

import { UserContext } from "../../providers/user-provider";
import { Frame } from "../frame";
import { RepoListItem } from "./repo-list-item";

import "./index.scss";
import { Button } from "../button";
import { navigate } from "../history";

export const RepoList = () => {
    const { data } = React.useContext(UserContext);

    if (!data) {
        throw new Error("Should not be reachable");
    }

    return (
        <Frame className="bh-repo-list">
            <div className="title"><span className="user">{ data.user }</span>'s repos</div>
            { data.repos.map(({ name, readme }) => <RepoListItem name={name} readme={readme} href={`/${data.user}/${name}`}/>) }
            <Button label="Create New Repo" onClick={() => navigate("/create")}/>
        </Frame>
    )
}