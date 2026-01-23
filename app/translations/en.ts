import { type Components, count, params } from "@/lib/i18n/components"

export const translations = {
    ColourSchemes: {
        ColoursDefault: "Default",
        ColoursWarm: "Warm",
        ColoursRosePine: "Rosé Pine",
        ModeAuto: "Auto",
        ModeLight: "Light",
        ModeDark: "Dark",
    },

    "components/AuthForm": {
        FieldServerLabel: "Server",
        FieldUsernameLabel: "Username",
        FieldPasswordLabel: "Password",
        AuthenticateButtonLabel: "Authenticate",
        "Invalid/Empty": params("Please enter a value for {name}"),
        Unauthorized: "Incorrect credentials.",
        ChangePasswordFormDialogTitle: "Change Password",
        ChangePasswordFormDialogDescription:
            "The server has indicated the password must be changed before proceeding.",
    },

    "components/AuthForm/ChangePasswordForm": {
        FieldCurrentPasswordLabel: "Current Password",
        FieldNewPasswordLabel: "New Password",
        FieldRepeatNewPasswordLabel: "Repeat new Password",
        ChangePasswordButtonLabel: "Change",
        "Invalid/Empty": params("{name} must not be empty"),
        Unauthorized: "Incorrect password",
        EmptyCurrentPassword: "Please enter current password",
        EmptyNewPassword: "Please enter a new password",
        EmptyRepeateNewPassword: "Please repeat the new password",
        NewPasswordsDoNotMatch: "New passwords don't match",
        NewPasswordIsOldPassword: "New password can't be old password",
    },

    "components/Sidebar": {
        SettingsLink: "Settings",
        NewMemo: "New Memo",
        Tags: "Tags",
    },

    "components/TabBar": {
        NewMemo: "New Memo",
        OverflowTitle: "Sidebar",
        CloseOverflow: "Close",
        OpenOffcanvasOverflow: "Open Sidebar",
    },

    "components/MemoTabPanel": {
        Close: "Close",
    },

    "components/Memo": {
        FootnoteBackLink: "Jump back",
    },

    "components/Memo/TOC": {
        Label: "Table of Contents",
    },

    "components/Memo/Actions": {
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

    "components/MemoList/ReloadButton": {
        Label: "Reload",
        Description: "There are new Memos available",
    },

    "components/Toolbar": {
        Extend: "Extend",
        Collapse: "Collapse",
    },

    "components/Editor": {
        Cancel: "Cancel",
        Save: "Save",
        DiscardChangesTitle: "Discard Changes",
        DiscardChangesDescription: "Are you sure you want to discard any changes?",
        DiscardChangesConfirmation: "Discard",
    },

    "components/Editor/Toolbar": {
        Label: "Editor Toolbar",
        GroupTextFormatting: "Text Formatting",
        TextFormattingBold: "Bold",
        TextFormattingItalic: "Italic",
        TextFormattingMonospace: "Monospace",
        InsertLink: "Insert Link",
    },

    "components/DateTime": {
        datetime: params("{date} at {time}"),
        invalidTime: params(`Invalid date "{date}": {error}`),
        ShowAbsoluteDateTooltip: "Show absolute date",
        ShowRelativeDateTooltip: "Show relative date",
    },

    "components/Notifications": {
        Label: "Notifications",
        Dismiss: "Dismiss",
    },

    "components/MemoListHeader": {
        DefaultHeader: "All Memos in chronological order",
        Archived: "Archived memos",
        Deleted: "Deleted Memos",
        MemosForTag: "Memos tagged",
        MemosForExactDate: "created on",
        MemosForExactDateStandalone: "Memos created on",
        MemosForQuery: "containing",
        MemosForQueryStandalone: "Memos containing",
    },

    "components/MemoListFilter": {
        ShowTagTreeFilterOffCanvas: "Show Tag Tree",
    },

    "components/MemoListFilter/Search": {
        Label: "Search for memos",
    },

    "components/MemoListFilter/DatePicker": {
        Label: params(
            "Memo date filter, gird is showing {minValue} to {maxValue}; currently selected date to filter by is: {selected}",
        ),
        NoSelection: "none",
        Today: "Today",
        PreviousMonth: "Previous Month",
        NextMonth: "Next Month",
        PickMonth: "Pick Month",
        PickYear: "Pick Year",
        Expand: "Expand date picker grid",
    },

    "components/MemoListFilter/TagTreeFilter": {
        Title: "Tags",
        CloseBtn: "Close",
    },

    "components/MemoListFilter/TagTree": {
        Label: "Tags",
        Count: "Count",
    },

    "components/MemoListFilter/StateFilter": {
        Label: "Filter by state",
        Archived: "Archived",
        Deleted: "Deleted",
    },

    "components/AlertDialog": {
        CancelButtonLabel: "Cancel",
    },

    "components/Figure": {
        ZoomButtonLabel: "Zoom Image",
        CloseButtonLabel: "Close",
    },

    "components/ZoomableImage": {
        ZoomButtonLabel: "Zoom Image",
        CloseButtonLabel: "Close",
    },

    "screens/Errors/NotFound": {
        Title: "Not Found",
        Detail: "The requested page could not be found",
    },

    "screens/Errors/Unauthorized": {
        Title: "Unauthorized",
        Detail: "You are not authorized to see this page",
    },

    "screens/InitSetup": {
        Title: "Setup",
        NewButtonLabel: "New",
        FromRemoteButtonLabel: "Existing from Remote",
        NextButtonLabel: "Next",
        BackButtonLabel: "Back",
        ConfigureEncryptionTitle: "Setup Encryption",
        CandidatePrivateCryptoKeyLabel: "Private Key",
        GenerateCandidatePrivateCryptoKeyLabel: "Generate Private Key",
        SelectSyncMethodTitle: "Select Sync Method",
        SyncMethodLocalOnly: "No Sync (local only)",
        SyncMethodRemoteSync: "Sync With Remote Server",
    },

    "screens/Unlock": {
        Title: "Unlock",
        PrivateKeyLabel: "Private Key",
        UnlockButton: "Unlock",
        "Invalid/Empty": params("{name} must not be empty"),
    },

    "screens/Unlock/StoreUnlockKeyCheckbox": {
        LabelDeviceSecureStorageWeb: "Store Key in encrypted in local browser storage",
        LabelDeviceSecureStorageNative: "Store key in device's secure storage",

        ExplainerPopupLabel: "Explanation",

        ExplainerDeviceSecureStorageWeb:
            "You private key will be encrypted using a separate cryptographic key that will be saved in the browser and marked as non-exrtractable.",
        ExplainerDeviceSecureStorageNative:
            "Your private key will be saved in your device's harware-backed secure storage element.",
    },

    "screens/Settings": {
        Title: "Settings",
        TabListLabel: "Setting Sections",
        TabLabelInterface: "Interface",
        TabLabelLangLocale: "Language & Locale",
        TabLabelSync: "Sync",
        TabLabelAPITokens: "API Tokens",
        TabLabelAbout: "About",
        TabLabelData: "Data",
    },

    "screens/Settings/InterfaceSettings": {
        Title: "Interface",
        Description: "Control how the user interface looks and behaves.",
        SectionTheme: "Theme",
        LabelColourScheme: "Colour Scheme",
        LabelModeOverride: "Light/Dark Mode Override",
        NameInputLabel: "Display Name",
        NameInputSaveLabel: "Save",
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
        LastSyncAt: "Last synced at:",
        LastSyncedNever: "Never",
        ManualSyncButtonLabel: "Sync Now",
        ManualFullDownloadButtonLabel: "Download Full State from Server",
        ManualFullUploadButtonLabel: "Upload Full State to Server",
        ManualFullDownloadWarning:
            "Warning, this will delete all local memo data and replace it with the latest version from the server. This cannot be undone!",
        ManualFullUploadWarning:
            "Warning, this will upload the current state and may override exisitng data. If another client with data that is not in this database pulls this state (using a full sync), data may be lost.",
    },

    "screens/Settings/SyncSettings/Setup": {
        Title: "Login In",
        FieldServerLabel: "Server",
        FieldUsernameLabel: "Username",
        FieldPasswordLabel: "Password",
        SetupButtonLabel: "Setup Sync",
        "Invalid/Empty": params("Please enter a value for {name}"),
        ErrorIncorrectCredentials: "Incorrect credentials.",
    },

    "screens/Settings/SyncSettings/ChangePassword": {
        Title: "Change Password",
        FieldCurrentPasswordLabel: "Current Password",
        FieldNewPasswordLabel: "New Password",
        FieldRepeatNewPasswordLabel: "Repeat new Password",
        ChangePasswordButtonLabel: "Change",
        "Invalid/Empty": params("{name} must not be empty"),
        ErrorCurrentPasswordIncorrect: "Incorrect password",
        ErrorEmptyCurrentPassword: "Please enter current password",
        ErrorEmptyNewPassword: "Please enter a new password",
        ErrorEmptyRepeateNewPassword: "Please repeat the new password",
        ErrorNewPasswordsDoNotMatch: "New passwords don't match",
        ErrorNewPasswordIsOldPassword: "New password can't be old password",
    },

    "screens/Settings/APITokens": {
        Title: "API Tokens",
        Description: "Manage API Tokens for remote API calls.",
    },

    "screens/Settings/APITokens/New": {
        Title: "Create API Token",
        FieldNameLabel: "Name",
        FieldExpiresInLabel: "Expires In",
        FieldExpiresInValueDays: count({
            one: "{count} day",
            many: "{count} days",
        }),
        FieldExpiresInValueMonths: count({
            one: "{count} month",
            many: "{count} months",
        }),
        ButtonLabel: "Create",
    },

    "screens/Settings/APITokens/LastCreated": {
        Title: "Created API Token",
        Notice: "Please note this token. IT WILL NOT BE SHOWN AGAIN!",
    },

    "screens/Settings/APITokens/List": {
        Title: "API Tokens",
        LabelName: "Name",
        LabelExpires: "Expires",
        LabelCreated: "Created",
        DeleteButton: "Delete",
        PrevPage: "Previous Page",
        NextPage: "Next Page",
    },

    "screens/Settings/About": {
        Title: "About",
        VersionLabel: "Version:",
        PublishDateLabel: "Published on:",
        IconLicenseLabel: "Icons:",
        ServerVersionLabel: "Server Version:",
        ServerPublishDateLabel: "Server Published on:",
        ServerGoVersionLabel: "Go Version:",
        ChangelogLink: "Changelog",
    },

    "screens/Settings/Data": {
        Title: "Data",
        Description: "Data Managment and Maintenance.",
    },

    "screens/Settings/Data/Jobs": {
        Title: "Jobs",

        RunLabel: "Run",
        RunningLabel: "Running",

        CleanupJobLabel: "Cleanup",
        CleanupJobDescription: "Removes orphaned metadata.",

        ExportJobLabel: "Export Database",
        ExportJobDescription: "Download an encrypted copy of the database.",
        ExportJobPrivateKeyLabel: "Private Key",
    },
} satisfies Components
