import * as React from "react";
import { classes } from "../../utils";

import "./index.scss";

export interface Props {
    children: React.ReactNode;
    className?: string;
}

export const Frame = (props: Props) => {
    return (
        <div className={classes(props.className, "bh-frame")}>
            { props.children }
        </div>
    );
};