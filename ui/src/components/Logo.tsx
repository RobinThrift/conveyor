import React from "react"

import LogoURL from "../../public/logo.svg?url"

export function Logo({ className }: { className?: string }) {
    return <img src={LogoURL} alt="logo" className={className} />
}
