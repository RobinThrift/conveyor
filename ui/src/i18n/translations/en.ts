import { type Components, count, params } from "@nanostores/i18n"

const sharedErrorTranslations: Components = {
    Input: {
        "Invalid/Empty": params("{name} must not be empty"),
    },
    ChangePassword: {
        CurrentPasswordIncorrect: "Incorrect password",
        EmptyCurrentPassword: "Please enter current password",
        EmptyNewPassword: "Please enter a new password",
        EmptyRepeateNewPassword: "Please repeat the new password",
        NewPasswordsDoNotMatch: "New passwords don't match",
        NewPasswordIsOldPassword: "New password can't be old password",
    },
}

export const translations = {
    "app/navigation": {
        Memos: "Memos",
        Archive: "Archive",
        Bin: "Bin",
        Settings: "Settings",
    },

    "components/Sidebar": {
        Logout: "Logout",
        GreetingMorning: "Good Morning,",
        GreetingAfternoon: "Good Afternoon,",
        GreetingEvening: "Good Evening,",
    },

    "components/Memo/Actions": {
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
        Auto: "Auto",
        Light: "Light",
        Dark: "Dark",
        SelectColourSchemeAriaLabel: "Select theme",
        SelectModeAriaLabel: "Select light/dark mode",
    },

    "components/Filters/Calendar": {
        Today: "Today",
    },

    "pages/Errors/NotFound": {
        Title: "Not Found",
        Detail: "The requested page could not be found",
    },

    "pages/Errors/Unauthorized": {
        Title: "Unauthorized",
        Detail: "You are not authorized to see this page",
    },

    "pages/LoginChangePassword": {
        ...sharedErrorTranslations.Input,
        ...sharedErrorTranslations["ChangePassword/Errors"],
        Title: "Change Password",
        CurrentPasswordLabel: "Current Password",
        NewPasswordLabel: "New Password",
        RepeatNewPasswordLabel: "Repeat New Password",
    },

    "pages/Settings/Tabs": {
        Interface: "Interface",
        Locale: "Language & Locale",
        Account: "Account",
        System: "System",
    },

    "pages/Settings/InterfaceSettingsTab": {
        Title: "Interface Settings",
        Description: "Control how the user interface looks and behaves.",
        SectionTheme: "Theme",
        LabelColourScheme: "Colour Scheme",
        LabelModeOverride: "Light/Dark Mode Override",
        LabelIcon: "Icon",
        SectionControls: "Controls",
        LabelEnableVimKeybindings: "Enable Vim keybindings",
        LabelEnableDoubleClickToEdit: "Enable double click to edit memos",
    },

    "pages/Settings/LocaleSettingsTab": {
        Title: "Language & Locale",
        Description: "Set your preferred language and locale.",
        LabelSelectLanguage: "Language",
        LabelSelectRegion: "Region",
    },

    "pages/Settings/AccountSettingsTab": {
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
    },

    "pages/Settings/SystemSettingsTab": {
        Title: "System",
        SectionAPITokensTitle: "API Tokens",
        SectionAPITokensDescription: "Create and revoke API Access Tokens.",
    },

    "pages/Settings/SystemSettingsTab/New": {
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

    "pages/Settings/SystemSettingsTab/LastCreated": {
        Title: "Created API Token",
        Notice: "Please note this token. IT WILL NOT BE SHOWN AGAIN!",
    },

    "pages/Settings/SystemSettingsTab/List": {
        Title: "API Tokens",
        ColumName: "Name",
        ColumExpires: "Expires",
        ColumnCreated: "Created",
        DeleteButton: "Delete",
        PrevPage: "Previous Page",
        NextPage: "Next Page",
    },
} satisfies Components
