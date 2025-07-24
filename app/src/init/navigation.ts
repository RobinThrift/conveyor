import {
    NavigationController,
    type Restore,
    type Screens,
    type Stacks,
} from "@/control/NavigationController"
import type { NavigationBackend } from "@/lib/navigation"

export function initNavigation({
    navigationBackend,
}: {
    navigationBackend: NavigationBackend<Screens, Stacks, Restore>
}) {
    return new NavigationController({
        backend: navigationBackend,
    })
}
