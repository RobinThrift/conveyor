import { ChangeSet, Text } from "@codemirror/state"

export function applyChangeSetJSON(text: string, changesetJSON: any): string {
    let changeset = ChangeSet.fromJSON(changesetJSON)
    let doc = Text.of(text.split("\n"))
    return changeset.apply(doc).toString()
}
