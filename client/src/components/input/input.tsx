import * as React from "react";

export interface Props {
    type?: "text" | "password"
    value?: string;
    onChange?: (value: string) => void;
    onEnter?: () => void;
    placeholder?: string;
    disabled?: boolean;
}

export const Input = (props: Props) => {
    return (
        <input
            className="bh-input"
            type={props.type}
            value={props.value}
            placeholder={props.placeholder}
            onKeyDown={(e) => e.key === "Enter" ? props.onEnter?.() : undefined}
            onChange={(e) => props.onChange?.(e.target.value)}
            disabled={props.disabled}
        />
    );
}