import { NavigationController, type Screens } from "@/control/NavigationController"
import type { NavigationBackend } from "@/lib/navigation"

export function initNavigation({
    navigationBackend,
}: {
    navigationBackend: NavigationBackend<Screens>
}) {
    return new NavigationController({
        backend: navigationBackend,
    })
}
