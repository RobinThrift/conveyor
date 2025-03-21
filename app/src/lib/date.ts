export {
    add,
    addDays,
    addHours,
    addMinutes,
    differenceInCalendarDays,
    format,
    isAfter,
    isBefore,
    roundToNearestMinutes,
    sub,
} from "date-fns"

export function currentDateTime() {
    return new Date()
}
