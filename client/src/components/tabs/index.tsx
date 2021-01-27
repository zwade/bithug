import * as React from "react";
import { classes } from "../../utils";

import "./index.scss";

export interface Props<T extends string> {
    options: readonly T[];
    currentTab?: T;
    onChange?: (value: T) => void;
}

export const Tabs = <T extends string>(props: Props<T>) => {
    return (
        <div className="bh-tabs">
            {
                props.options.map((value) => (
                    <div
                        className={classes("tab", props.currentTab === value ? "active" : "inactive")}
                        onClick={() => props.onChange?.(value)}
                    >
                        { value }
                    </div>
                ))
            }
        </div>
    )
};
