export type Command = () => void

export type Commands = {
    toggleBold: Command
    toggleItalics: Command
    toggleMonospace: Command
    insertLink: Command
}
