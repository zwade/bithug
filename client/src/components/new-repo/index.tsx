import * as React from "react";

import { Api } from "../../client";
import { Button } from "../button";
import { Frame } from "../frame";
import { navigate } from "../history";
import { Input } from "../input";
import { Nav } from "../nav";
import { Radio } from "../radio";

import "./index.scss";

export const NewRepo = () => {
    const [name, setName] = React.useState("")
    const [initialize, setInitialize] = React.useState(false);

    const createRepo = async () => {
        const result = await Api.Web.createRepo(name, initialize);
        navigate(`/${result.repo}`);
    }

    return (
        <>
            <Nav/>
            <div className="bh-new-repo">
                <Frame>
                    <div className="title">Create new Repo</div>
                    <Input type="text" placeholder="Repository Name" value={name} onChange={setName}/>
                    <Radio
                        options={[{ value: true, label: "Initialize Readme" }, { value: false, label: "Leave Repository Empty" }]}
                        value={initialize}
                        onChange={setInitialize}
                    />
                    <Button label="Create Repository" onClick={createRepo}/>
                </Frame>
            </div>
        </>
    )
}