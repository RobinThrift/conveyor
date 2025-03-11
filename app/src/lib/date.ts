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
} from "date-fns"

export function currentDateTime() {
    return new Date()
}
