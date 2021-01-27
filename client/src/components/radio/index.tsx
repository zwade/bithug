import * as React from "react";
import { classes } from "../../utils";

import "./index.scss";

export interface Props<T> {
    options: readonly { label: string, value: T }[];
    value?: T;
    onChange?: (value: T) => void;
}

export const Radio = <T extends {}>(props: Props<T>) => {
    return (
        <div className="bh-radio">
            {
                props.options.map(({ label, value }) => (
                    <div
                        key={label}
                        className={classes("radio-option", value === props.value ? "active" : "inactive")}
                        onClick={() => props.onChange?.(value)}
                    >
                        <div className="bubble"/>
                        <div className="label">{ label }</div>
                    </div>
                ))
            }
        </div>
    )
}