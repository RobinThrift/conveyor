import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Markdown } from "./Markdown"

import "@/index.css"

const meta: Meta<typeof Markdown> = {
    title: "Components/Markdown",
    component: Markdown,
}

export default meta
type Story = StoryObj<typeof Markdown>

export const Everything: Story = {
    name: "Markdown",
    argTypes: {
        onClickTag: { action: "onClickTag" },
    },
    args: {
        id: "storybook",
        children: `# Markdown Content (Heading 1)
${faker.lorem.lines({ min: 1, max: 10 })}

## Paragraphs with Tags (Heading 2)
${faker.lorem.lines({ min: 1, max: 10 })}

#tag-1 #tag/nesting

${faker.lorem.lines({ min: 1, max: 10 })}

### Lists (Heading 3)

- this is an
    - unordered list
    - with some
        - with nested items

- back to top level

1. orderd list
1. items
    - with nested regular
    - list
    - items
1. and ordered
    1. nested list
    1. items

#### Blockquote (Heading 4)
> ${faker.lorem.lines({ min: 1, max: 10 })}

And make note of the footnote[^fn1]

[^fn1]: Very Important content here

##### Text Styling (Heading 5)

This is some *emphasized* content and some **strong** content.
This text will be \`monospaced\`... hopefully. ~~Scratch this.~~

###### Heading 6
This is a [link](${faker.internet.url()}), an auto link (http://example.com) and an image will follow:

![image caption](${faker.image.url({ height: 1500, width: 1800 })})

***

### More Tests

The following  
will be on separate  
lines.


## Code Content
\`\`\`typescript
function parseMarkdown(raw: string): React.ReactNode | React.ReactNode[] {
    let ast = fromMarkdown(raw)
    return ast.children.map((c) => astNodeToJSX(c))
}
\`\`\`

## Tables

| left aligned | centre aligned | right aligned |
| :----------- | :------------: | ------------: |
| Cell A1      | Cell B1        | Cell C1       |
| Cell A2      | Cell B2        | Cell C2       |
| Cell A3      | Cell B3        | Cell C3       |

`,
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

	config, err := app.ParseConfig("BELT_")
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
