import * as React from "react";
import { classes } from "../../utils";

import "./index.scss";

export interface Props {
    children: React.ReactNode;
    inline?: boolean;
    className?: string;
}

export const Code = (props: Props) => {
    return (
        <div className={classes("bh-code", props.inline ? "code-inline" : "code-block", props.className)}>
            { props.children }
        </div>
    );
};