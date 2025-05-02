import React from "react"

import { MainScreen as MMainScreen } from "./MainScreen"

export type { MainScreenProps } from "./MainScreen"

export const MainScreen = React.memo(MMainScreen)
