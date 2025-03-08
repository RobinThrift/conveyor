import { type Components, params } from "@/lib/i18n/components"

export const translations = {
    "components/Navigation": {
        Settings: "Settings",
        Back: "Back",
    },

    "components/Memo": {
        ShowMore: "Show More",
    },

    "components/Memo/Actions": {
        View: "View",
        Edit: "Edit",
        Archive: "Archive",
        Delete: "Delete",
        Unarchive: "Unarchive",
        Restore: "Restore",
    },

    "components/Memo/DateTime": {
        CreatedAt: "Created at",
        UpdatedAt: "Updated at",
    },

    "components/MemoList/DayHeader": {
        Today: "Today",
        Yesterday: "Yesterday",
    },

    "components/MemoList/LayoutSelect": {
        Label: "Select list layout",
        LayoutMasonry: "Masonry",
        LayoutSingle: "Single",
        LayoutUltraCompact: "Ultra Compact",
    },

    "components/Editor": {
        Cancel: "Cancel",
        Save: "Save",
        DiscardChangesTitle: "Discard Changes",
        DiscardChangesDescription:
            "Are you sure you want to discard any changes?",
        DiscardChangesConfirmation: "Discard",
    },

    "components/Editor/Toolbar": {
        TextFormatting: "Text formatting",
        TextFormattingBold: "Bold",
        TextFormattingItalic: "Italic",
        TextFormattingMonospace: "Monospace",
        InsertLink: "Insert Link",
    },

    "components/DateTime": {
        datetime: params("{date} at {time}"),
        invalidTime: params(`Invalid date "{date}": {error}`),
    },

    "components/ThemeSwitcher": {
        ColoursDefault: "Default Colours",
        ColoursWarm: "Warm",
        RosePine: "Rosé Pine",
        Auto: "Auto",
        Light: "Light",
        Dark: "Dark",
        SelectColourSchemeAriaLabel: "Select theme",
        SelectModeAriaLabel: "Select light/dark mode",
    },

    "components/Notifications": {
        Label: "Notifications",
        Dismiss: "Dismiss",
    },

    "components/Greeting": {
        Morning: "Good Morning, ",
        Afternoon: "Good Afternoon, ",
        Evening: "Good Evening, ",
    },

    "components/MemoListHeader": {
        Archived: "Archived memos",
        Deleted: "Deleted Memos",
        MemosForTag: "Memos tagged",
        MemosForExactDate: "created on",
        MemosForExactDateStandalone: "Memos created on",
        MemosForQuery: "containing",
        MemosForQueryStandalone: "Memos containing",
    },

    "components/MemoListFilter": {
        TriggerLabel: "More filter",
        OffScreenTitle: "Tags",
        OffScreenDescription: "Tags and state filters",
    },

    "components/MemoListFilter/DatePicker": {
        Today: "Today",
    },

    "components/MemoListFilter/TagTree": {
        Label: "Tags",
    },

    "components/MemoListFilter/StateFilter": {
        Archived: "Archived",
        Deleted: "Deleted",
    },

    "screens/Errors/NotFound": {
        Title: "Not Found",
        Detail: "The requested page could not be found",
    },

    "screens/Errors/Unauthorized": {
        Title: "Unauthorized",
        Detail: "You are not authorized to see this page",
    },

    "screens/Unlock": {
        Title: "Unlock",
        PasswordLabel: "Password",
        UnlockButton: "Unlock",
        ErrorFieldEmpty: params("{name} must not be empty"),
    },

    "screens/SingleMemoScreen": {
        Back: "Back",
    },

    "screens/Settings": {
        Title: "Settings",
    },

    "screens/Settings/InterfaceSettings": {
        Title: "Interface",
        Description: "Control how the user interface looks and behaves.",
        SectionTheme: "Theme",
        LabelColourScheme: "Colour Scheme",
        LabelModeOverride: "Light/Dark Mode Override",
        LabelIcon: "Icon",
        SectionControls: "Controls",
        LabelEnableVimKeybindings: "Enable Vim keybindings",
        LabelEnableDoubleClickToEdit: "Enable double click to edit memos",
    },

    "screens/Settings/LocaleSettings": {
        Title: "Language & Locale",
        Description: "Set your preferred language and locale.",
        LabelSelectLanguage: "Language",
        LabelSelectRegion: "Region",
    },

    "screens/Settings/SyncSettings": {
        Title: "Sync",
        Description: "Setup sync settings and manage credentials.",
    },

    "screens/Settings/SyncSettings/Info": {
        IsEnabled: "Sync Enabled:",
        ClientID: "Client ID:",
    },

    "screens/Settings/SyncSettings/Setup": {
        Title: "Setup",
        FieldUsernameLabel: "Username",
        FieldPasswordLabel: "Password",
        LoginButtonLabel: "Login",
        ErrorFieldEmpty: params("{name} must not be empty"),
        ErrorIncorrectCredentials: "Incorrect credentials.",
    },

    "screens/Settings/SyncSettings/ChangePassword": {
        Title: "Change Password",
        FieldCurrentPasswordLabel: "Current Password",
        FieldNewPasswordLabel: "New Password",
        FieldRepeatNewPasswordLabel: "Repeat new Password",
        ChangePasswordButtonLabel: "Change",
        ErrorFieldEmpty: params("{name} must not be empty"),
        ErrorCurrentPasswordIncorrect: "Incorrect password",
        ErrorEmptyCurrentPassword: "Please enter current password",
        ErrorEmptyNewPassword: "Please enter a new password",
        ErrorEmptyRepeateNewPassword: "Please repeat the new password",
        ErrorNewPasswordsDoNotMatch: "New passwords don't match",
        ErrorNewPasswordIsOldPassword: "New password can't be old password",
    },
} satisfies Components
