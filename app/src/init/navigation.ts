import { NavigationController, type Restore, type Screens } from "@/control/NavigationController"
import type { NavigationBackend } from "@/lib/navigation"

export function initNavigation({
    navigationBackend,
}: {
    navigationBackend: NavigationBackend<Screens, Restore>
}) {
    return new NavigationController({
        backend: navigationBackend,
    })
}
