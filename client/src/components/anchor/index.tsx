import * as React from "react";
import { classes } from "../../utils";
import { navigate } from "../history";

import "./index.scss";

export interface Props {
    href?: string;
    onClick?: () => void;
    children?: React.ReactNode;
    className?: string;
}

export const A = (props: Props) => {
    const onClick = () => (props.onClick?.(), props.href ? navigate(props.href) : undefined);
    return (
        <a className={classes("bh-anchor", props.className)} onClick={onClick}>{ props.children }</a>
    );
}