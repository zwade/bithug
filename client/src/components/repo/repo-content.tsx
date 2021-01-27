import * as React from "react";

import { RepoContext } from "../../providers/repo-provider";
import { A } from "../anchor";
import { Tree } from "./tree";
import { Blob } from "./blob";
import { Frame } from "../frame";

export const RepoContent = () => {
    const { state, changeDir } = React.useContext(RepoContext);
    return (
        <div className="bh-repo content">
            <Frame>
                <div className="title">
                    <div className="path">
                        {
                            state.currentPath.map((segment, i) => (
                                <A
                                    className="path-segment"
                                    onClick={() => changeDir(state.currentPath.slice(0, i + 1), "tree")}
                                >
                                    { segment.name }
                                </A>
                            ))
                        }
                    </div>
                </div>
                {
                    state.currentValue.kind === "tree"
                        ? (
                            <>
                                <Tree path={state.currentPath} tree={state.currentValue.tree} changeDir={changeDir}/>
                                <Blob blob={state.readme}/>
                            </>
                        ) : (
                            <Blob blob={state.currentValue.blob}/>
                        )
                }
            </Frame>
        </div>
    )
};