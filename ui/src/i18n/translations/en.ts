import { type Components, count, params } from "@nanostores/i18n"

const sharedErrorTranslations: Components = {
    Input: {
        "Invalid/Empty": params("{name} must not be empty"),
    },
    "ChangePassword/Errors": {
        CurrentPasswordIncorrect: "Incorrect password",
        EmptyCurrentPassword: "Please enter current password",
        EmptyNewPassword: "Please enter a new password",
        EmptyRepeateNewPassword: "Please repeat the new password",
        NewPasswordsDoNotMatch: "New passwords don't match",
        NewPasswordIsOldPassword: "New password can't be old password",
    },
}

export const translations = {
    "components/Navigation": {
        Memos: "Memos",
        Archive: "Archive",
        Bin: "Bin",
        Settings: "Settings",
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

    "components/Editor": {
        Cancel: "Cancel",
        Save: "Save",
    },

    "components/DateTime": {
        datetime: params("{date} at {time}"),
        invalidTime: params(`Invalid date "{date}": {error}`),
    },

    "components/ThemeSwitcher": {
        ColoursDefault: "Default Colours",
        RosePine: "Rosé Pine",
        Auto: "Auto",
        Light: "Light",
        Dark: "Dark",
        SelectColourSchemeAriaLabel: "Select theme",
        SelectModeAriaLabel: "Select light/dark mode",
    },

    "components/Filters": {
        TabDate: "Date",
        TabTags: "Tags",
    },

    "components/Filters/Calendar": {
        Today: "Today",
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

    "pages/Errors/NotFound": {
        Title: "Not Found",
        Detail: "The requested page could not be found",
    },

    "pages/Errors/Unauthorized": {
        Title: "Unauthorized",
        Detail: "You are not authorized to see this page",
    },

    "pages/Login": {
        ...sharedErrorTranslations.Input,
        Title: "Login",
        UsernameLabel: "Username",
        PasswordLabel: "Password",
        LoginButton: "Login",
    },

    "pages/LoginChangePassword": {
        ...sharedErrorTranslations.Input,
        ...sharedErrorTranslations["ChangePassword/Errors"],
        Title: "Change Password",
        CurrentPasswordLabel: "Current Password",
        NewPasswordLabel: "New Password",
        RepeatNewPasswordLabel: "Repeat New Password",
        ChangePasswordButton: "Change Password",
    },

    "pages/ListMemos": {
        DayToday: "Today",
        DayYesterday: "Yesterday",
        LayoutSelectLabel: "Select list layout",
        LayoutSingle: "Single",
        LayoutMasonry: "Masonry",
        OpenFilterOverlayButtonLabel: "Open Filter Overlay",
    },

    "pages/Settings": {
        Title: "Settings",
    },

    "pages/Settings/InterfaceSettings": {
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

    "pages/Settings/LocaleSettings": {
        Title: "Language & Locale",
        Description: "Set your preferred language and locale.",
        LabelSelectLanguage: "Language",
        LabelSelectRegion: "Region",
    },

    "pages/Settings/AccountSettings": {
        ...sharedErrorTranslations.Input,
        ...sharedErrorTranslations["ChangePassword/Errors"],
        Title: "Account",
        Description: "Manage your account.",
        DisplayNameLabel: "Display Name",
        UpdateDisplayNameButton: "Update",
        ChangePasswordTitle: "Change Password",
        CurrentPasswordLabel: "Current Password",
        NewPasswordLabel: "New Password",
        RepeatNewPasswordLabel: "Repeat New Password",
        ChangePasswordButton: "Change",
        EmptyDisplayName: "Display Name must not be empty",
        Logout: "Logout",
    },

    "pages/Settings/SystemSettings": {
        Title: "System",
        SectionAPITokensTitle: "API Tokens",
        SectionAPITokensDescription: "Create and revoke API Access Tokens.",
    },

    "pages/Settings/SystemSettings/New": {
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

    "pages/Settings/SystemSettings/LastCreated": {
        Title: "Created API Token",
        Notice: "Please note this token. IT WILL NOT BE SHOWN AGAIN!",
    },

    "pages/Settings/SystemSettings/List": {
        Title: "API Tokens",
        ColumName: "Name",
        ColumExpires: "Expires",
        ColumnCreated: "Created",
        DeleteButton: "Delete",
        PrevPage: "Previous Page",
        NextPage: "Next Page",
    },
} satisfies Components
