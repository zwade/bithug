import * as React from "react";

export interface Props {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const TextArea = (props: Props) => {
    return (
        <textarea
            className="bh-textarea"
            value={props.value}
            placeholder={props.placeholder}
            onChange={(e) => props.onChange?.(e.target.value)}
            disabled={props.disabled}
        />
    );
}