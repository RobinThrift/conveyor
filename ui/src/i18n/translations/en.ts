import { type Translations, params } from "@nanostores/i18n"

export const translations = {
    "app/navigation": {
        Memos: "Memos",
        Archive: "Archive",
        Bin: "Bin",
        Settings: "Settings",
    } satisfies Translations,

    "components/Sidebar": {
        Logout: "Logout",
        GreetingMorning: "Good Morning,",
        GreetingAfternoon: "Good Afternoon,",
        GreetingEvening: "Good Evening,",
    } satisfies Translations,

    "components/Memo/Actions": {
        Archive: "Archive",
        Delete: "Delete",
    } satisfies Translations,

    "components/Memo/DateTime": {
        CreatedAt: "Created at",
        UpdatedAt: "Updated at",
    } satisfies Translations,

    "components/Editor": {
        Cancel: "Cancel",
        Save: "Save",
    } satisfies Translations,

    "components/DateTime": {
        datetime: params("{date} at {time}"),
    } satisfies Translations,

    "components/ThemeSwitcher": {
        Auto: "Auto",
        Light: "Light",
        Dark: "Dark",
    } satisfies Translations,

    "components/Filters/Calendar": {
        Today: "Today",
    } satisfies Translations,
}
