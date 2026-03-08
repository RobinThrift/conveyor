import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useMemo } from "react"
import { action } from "storybook/actions"

import { generateFullTestContent } from "@/lib/testhelper/memos"

import { Markdown } from "./Markdown"

import "@/ui/styles/index.css"
import { TextEditor } from "../Editor/TextEditor"

const meta: Meta<typeof Markdown> = {
    title: "Components/Markdown",
    component: Markdown,
    args: {
        className: "memo-content",
    },
}

export default meta
type Story = StoryObj<typeof Markdown>

export const Everything: Story = {
    name: "Markdown",
    args: {
        id: "storybook",
        children: generateFullTestContent(),
    },
    render: (args) => (
        <div className="container mx-auto">
            <Markdown {...args} />
        </div>
    ),
}

export const Code: Story = {
    args: {
        id: "code",
        children: `# Markdown Code Test

## JavaScript/TypeScript

\`\`\`typescript
function parseMarkdown(raw: string): React.ReactNode | React.ReactNode[] {
    let ast = fromMarkdown(raw)
    return ast.children.map((c) => astNodeToJSX(c))
}
\`\`\`

## Go

\`\`\`go
type App struct {
    config Config
    srv    *http.Server
    db     *sqlite.SQLite
}

func main() {
    if err := run(context.Background()); err != nil {
        panic(err)
    }
}

func run(ctx context.Context) error {
    startCtx, startCtxCancel := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
    defer startCtxCancel()

    config, err := app.ParseConfig("CONVEYOR_")
    if err != nil {
        return err
    }

    _, err = logging.NewGlobalLogger(config.Log.Level, config.Log.Format)
    if err != nil {
        return err
    }

    tracing, err := tracing.NewGlobal(startCtx, config.Tracing)
    if err != nil {
        return err
    }

    errs := make(chan error)

    app := app.New(config)
    go func() {
        errs <- app.Start(startCtx)
    }()

    select {
    case <-startCtx.Done():
    case err = <-errs:
        if err != nil {
            return err
        }
    }

    stopCtx, stopCtxCancel := context.WithTimeout(ctx, time.Minute)
    defer stopCtxCancel()

    return errors.Join(err, app.Stop(stopCtx), tracing.Stop(stopCtx))
}
\`\`\`


## Rust

\`\`\`rust
mod app;
mod board;
mod pipico;

#[entry]
fn _main() -> ! {
    info!("Program start");

    // Grab our singleton objects
    let mut pac = pac::Peripherals::take().unwrap();
    let core = pac::CorePeripherals::take().unwrap();

    // Set up the watchdog driver - needed by the clock setup code
    let mut watchdog = hal::Watchdog::new(pac.WATCHDOG);

    // Configure the clocks
    // The default is to generate a 125 MHz system clock
    let clocks = hal::clocks::init_clocks_and_plls(
        bsp::XOSC_CRYSTAL_FREQ,
        pac.XOSC,
        pac.CLOCKS,
        pac.PLL_SYS,
        pac.PLL_USB,
        &mut pac.RESETS,
        &mut watchdog,
    )
    .ok()
    .unwrap();

    // ...
}
\`\`\`


## Python

\`\`\`python
import os


def get_env(name: str):
    """Get the environment variable by name or None."""
    return os.environ.get(name)


def get_env_int(name: str) -> int:
    """Get the environment variable by name or None."""
    if name in os.environ:
        return int(os.environ[name])

    return 0

def get_env_list(name: str) -> list:
    """Get the environment variable by name, split at ',' or empty list."""
    if name in os.environ:
        return os.environ[name].split(",")

    return []
\`\`\`

## Bash

\`\`\`bash
for element in Hydrogen Helium Lithium Beryllium
do
  echo "Element: $element"
done

for f in file_{1..3}; do 
  for j in server_{1..3}; do 
    echo "Copying file $f to server $j"; 
    # command to copy files
  done; 
done

for I in $(seq 1 10);
do
    echo $I
done

for ((I = 0 ; I < max ; I++ )); 
do 
	echo "$I"; 
done

# Changing file extension
for file in *.jpeg; do
    mv -- "$file" "\${file%.jpeg}.jpg"
done
\`\`\`


## JSON

\`\`\`json
{
  "apiVersion": "v1",
  "kind": "Pod",
  "metadata": { "name": "volume-debugger" },
  "spec": {
    "containers": [{
        "image": "busybox",
        "name": "volume-debugger",
        "command": [ "tail" ],
        "args": [ "-f", "/dev/null" ],
        "volumeMounts": [{
            "name": "data",
            "mountPath": "/data"
        }],
        "securityContext": {
          "allowPrivilegeEscalation": false,
          "capabilities": { "drop": [ "ALL" ] },
          "readOnlyRootFilesystem": true,
          "runAsNonRoot": true
        }
    }],
    "volumes": [{
        "name": "data",
        "persistentVolumeClaim": {
          "claimName": "<CLAIM_NAME>"
        }
    }]
  }
}
\`\`\`


## YAML

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: volume-debugger
spec:
  containers:
  - image: busybox
    name: volume-debugger
    command: ["tail"]
    args: ["-f", "/dev/null"]
    volumeMounts:
    - name: data
      mountPath: /data
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
        - ALL
      readOnlyRootFilesystem: true
      runAsNonRoot: true
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: <CLAIM_NAME>
\`\`\`

`,
    },
    render: (args) => (
        <div className="container mx-auto">
            <Markdown {...args} />
        </div>
    ),
}

export const CustomBlocksLinkPreview: Story = {
    name: "Custom Blocks/Link Preview",
    args: {
        id: "storybook",
        children: `
/// link-preview
[GitHub - RobinThrift/conveyor](https://github.com/RobinThrift/conveyor/)

![](https://opengraph.githubassets.com/5b69586608c65af6d40aac3a56b740a0eb60af37726a32c627a0c4f61688c151/RobinThrift/conveyor)

Contribute to RobinThrift/conveyor development by creating an account on GitHub.
///
`,
    },
    render: (args) => (
        <div className="container mx-auto">
            <Markdown {...args} />
        </div>
    ),
}

export const CustomBlocksDetails: Story = {
    name: "Custom Blocks/Details",
    args: {
        id: "storybook",
        children: `
/// details | className="text-primary" summary="Collapsible"
${faker.lorem.paragraph()}
/// 
`,
    },
    render: (args) => (
        <div className="container mx-auto">
            <Markdown {...args} />
        </div>
    ),
}

export const CustomBlocksUnknown: Story = {
    name: "Custom Blocks/Unknown",
    args: {
        id: "storybook",
        children: `
/// unkown-custom-block
${faker.lorem.paragraph()}
///
`,
    },
    render: (args) => (
        <div className="container mx-auto">
            <Markdown {...args} />
        </div>
    ),
}
export const Mermaid: Story = {
    args: {
        id: "mermaid",
        children: `# Mermaid Diagrams Test
## Flowchart
\`\`\`mermaid
flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
\`\`\`

## Class
\`\`\`mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }
\`\`\`

## Entity Relationship
\`\`\`mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : includes
    CUSTOMER {
        string id
        string name
        string email
    }
    ORDER {
        string id
        date orderDate
        string status
    }
    PRODUCT {
        string id
        string name
        float price
    }
    ORDER_ITEM {
        int quantity
        float price
    }
\`\`\`

## Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!
\`\`\`

## State Diagram
\`\`\`mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
\`\`\`

## Block Diagram
\`\`\`mermaid
block
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
\`\`\`

## Mindmap
\`\`\`mermaid
mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
\`\`\`

## Packet
\`\`\`mermaid
---
title: "TCP Packet"
---
packet
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"
96-99: "Data Offset"
100-105: "Reserved"
106: "URG"
107: "ACK"
108: "PSH"
109: "RST"
110: "SYN"
111: "FIN"
112-127: "Window"
128-143: "Checksum"
144-159: "Urgent Pointer"
160-191: "(Options and Padding)"
192-255: "Data (variable length)"
\`\`\`

## Git
\`\`\`mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
\`\`\`

## Pie
\`\`\`mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\`\`\`

## Quadrant Chart
\`\`\`mermaid
quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]
\`\`\`

## Radar
\`\`\`mermaid
---
title: "Grades"
---
radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve a["Alice"]{85, 90, 80, 70, 75, 90}
  curve b["Bob"]{70, 75, 85, 80, 90, 85}

  max 100
  min 0
\`\`\`

## Timeline
\`\`\`mermaid
timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter
\`\`\`

## Math
\`\`\`mermaid
sequenceDiagram
    autonumber
    participant 1 as $$\\alpha$$
    participant 2 as $$\\beta$$
    1->>2: Solve: $$\\sqrt{2+2}$$
    2-->>1: Answer: $$2$$
    Note right of 2: $$\\sqrt{2+2}=\\sqrt{4}=2$$
\`\`\`

## Error in Diagram
\`\`\`mermaid
bock
columns 1
  db(("DB"))
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
\`\`\`
`,
    },
    render: (args) => (
        <div className="container mx-auto">
            <Markdown {...args} />
        </div>
    ),
}

export const EditorAndRendered: Story = {
    args: {
        id: "storybook",
        children: generateFullTestContent(),
        className: "memo-content",
    },
    render: (args) => (
        <div className="grid grid-cols-2 gap-2">
            <article className="@container memo">
                <Markdown {...args} />
            </article>
            <article className="@container memo is-editing">
                <div className="editor h-full">
                    {/** biome-ignore lint/correctness/useUniqueElementIds: is just a test */}
                    <TextEditor
                        id="12345"
                        onSave={action("onSave")}
                        onChange={action("onChange")}
                        onCancel={action("onCancel")}
                        transferAttachment={() => {
                            let { resolve, reject, promise } = Promise.withResolvers<void>()
                            let r = Math.random() * 5000 + 1000
                            setTimeout(() => {
                                if (Math.random() > 0.8) {
                                    reject()
                                    return
                                }
                                resolve(undefined)
                            }, r)
                            return promise
                        }}
                        vimModeEnabled={true}
                        content={args.children}
                        tags={[]}
                    >
                        {() => null}
                    </TextEditor>
                </div>
            </article>
        </div>
    ),
}

export const StressTest: Story = {
    render: (args) => {
        let allArgs = useMemo(() => {
            let allArgs: (typeof args)[] = []
            for (let i = 0; i <= 100; i++) {
                allArgs.push({
                    ...args,
                    children: generateFullTestContent(),
                })
            }

            return allArgs
        }, [args])

        return (
            <div className="grid grid-cols-8">
                {allArgs.map((args, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: just a storybook example
                    <Markdown key={i} {...args} />
                ))}
            </div>
        )
    },
}
