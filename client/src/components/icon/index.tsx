import * as React from "react";
import { classes } from "../../utils";

import "./index.scss";

export interface Props {
    className?: string;
    children: string;
}

export const Icon = (props: Props) => (
    <i className={classes("material-icon", props.className)}>{ props.children }</i>
);
