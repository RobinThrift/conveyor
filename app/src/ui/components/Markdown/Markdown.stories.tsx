import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React, { useMemo } from "react"

import { generateFullTestContent } from "@/lib/testhelper/memos"
import { decorator } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { Markdown } from "./Markdown"

const meta: Meta<typeof Markdown> = {
    title: "Components/Markdown",
    component: Markdown,
    decorators: [decorator],
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
    mv -- "$file" "\${file%.jpeg\}.jpg"
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

export const Directives: Story = {
    name: "Directives",
    args: {
        id: "storybook",
        children: `
# Directives

::link-preview[https://github.com/RobinThrift/conveyor/]{title="GitHub - RobinThrift/conveyor" description="Contribute to RobinThrift/conveyor development by creating an account on GitHub." img="https://opengraph.githubassets.com/5b69586608c65af6d40aac3a56b740a0eb60af37726a32c627a0c4f61688c151/RobinThrift/conveyor"  alt="Contribute to RobinThrift/conveyor development by creating an account on GitHub."}

#tag-a #tab-b

:::details{className="text-primary" summary="Collapsible"}
${faker.lorem.paragraph()}
:::


::foo[directive]{attrs="value"}
`,
    },
    render: (args) => (
        <div className="container mx-auto">
            <Markdown {...args} />
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
