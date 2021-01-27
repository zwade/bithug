import * as React from "react";

import { classes } from "../../utils";

import "./index.scss";

export interface Props {
    label: React.ReactNode;
    onClick?: () => void;
    className?: string
}

export const Button = (props: Props) => {
    return (
        <button
            className={classes(props.className, "bh-button")}
            onClick={() => props.onClick?.()}
        >
            { props.label }
        </button>
    );
}