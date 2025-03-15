# Setup Slice

### Setup State Machine

```mermaid
---
config:
    theme: base
    look: handDrawn
---

flowchart TB
    U(unknown) -- loadSetupInfo --> L{isSetup}
    L -- true --> D(((done)))
    L -- false --> I{initial-setup}
    I -- new --> SM(choose-sync-method)
    I -- from-remote --> CRS(configure-remote-sync)
    SM -- local-only --> LOCE("configure-encryption (local-only)")
    SM -- remote-sync --> NewCRS("configure-remote-sync (new)")
    CRS --> CE(configure-encryption)
    NewCRS <--> NewRErr((("remote-error (new)")))
    NewCRS --> NewCE("configure-encryption (new)")
    NewCE --> D
    CRS --> RErr(((remote-error)))
    RErr --> CRS
    CE -- start-sync --> Sync(sync)
    Sync --> D
    Sync --> SyncErr(((sync-error)))
    SyncErr --> CE
    LOCE --> D

    RErr:::error 
    SyncErr:::error
    NewRErr:::error

    classDef error stroke-width:4px, stroke-dasharray: 0, stroke:#f16b65, fill:#f16b65, color:#FFFFFF
```

