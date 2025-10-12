import { faker } from "@faker-js/faker"

import type { Memo } from "@/domain/Memo"
import type { Tag } from "@/domain/Tag"
import { currentDateTime, roundToNearestMinutes } from "@/lib/i18n"

export function generateMockMemos() {
    let now = roundToNearestMinutes(currentDateTime())

    let tags: Tag[] = []

    let memos: Memo[] = []

    for (let i = 0; i < 100; i++) {
        let n = faker.number.int({ min: 0, max: 100 })
        if (n > 50) {
            tags.push({
                tag: faker.word.noun(),
                count: 0,
            })
        } else if (n > 30) {
            tags.push({
                tag: `${faker.word.noun()}/${faker.word.noun()}`,
                count: 0,
            })
        } else {
            tags.push({
                tag: `${faker.word.noun()}/${faker.word.noun()}/${faker.word.noun()}`,
                count: 0,
            })
        }
    }

    tags.sort()

    for (let i = 0; i < 120; i++) {
        let memoTags = [faker.helpers.arrayElement(tags).tag, faker.helpers.arrayElement(tags).tag]

        tags.forEach((t) => {
            if (memoTags.includes(t.tag)) {
                t.count++
            }
        })

        let memo = {
            id: `10-${i}`,
            content: generateMemo({
                title: `Memo ${i}`,
                tags: memoTags,
            }),
            isArchived: i > 90 && i < 100,
            isDeleted: i > 100,
            createdAt: now.subtract({ hours: i * 2 }).toDate("utc"),
            updatedAt: now.subtract({ hours: i }).toDate("utc"),
        }

        memos.push(memo)
    }

    return { memos, tags }
}

export function generateFullTestContent(): string {
    return `# Markdown Content (Heading 1)
${faker.lorem.lines({ min: 1, max: 10 }).replaceAll("\n", " ")}

## Paragraphs (Heading 2) [with a link](https://github.com/RobinThrift/conveyor)
${faker.lorem.lines({ min: 1, max: 10 }).replaceAll("\n", " ")}

#tag-1 #tag/nesting

${faker.lorem.lines({ min: 1, max: 10 }).replaceAll("\n", " ")}

### Lists (Heading 3)

- this is an
    - unordered list 
    - with some
        - with nested items with a [link](https://github.com/RobinThrift/conveyor)
        - and another
- back to top level
- and here's a [link](https://github.com/RobinThrift/conveyor)

1. orderd list
1. items and a [link](https://github.com/RobinThrift/conveyor)
    - with nested regular
    - list including a [link](https://github.com/RobinThrift/conveyor)
    - items
1. and ordered
    1. nested list
    1. items

- [ ] a simple
- [x] task list
- [ ] with some items

#### Blockquote (Heading 4)
> ${faker.lorem.lines({ min: 1, max: 10 }).replaceAll("\n", " ")}

And make note of the footnote[^fn1]

[^fn1]: **Very** important *content* here. With a [link]${faker.internet.url()}.

##### Text Styling (Heading 5)

This is some *emphasized* content and some **strong** content.
This text will be \`monospaced\`... hopefully. ~~Scratch this.~~

###### Heading 6
This is a [link](${faker.internet.url()}), an auto link (http://example.com).  
This an [*emphasized link*](${faker.internet.url()}) and a __[strong link](${faker.internet.url()})__.  
More autolinks: *${faker.internet.url()}*, **${faker.internet.url()}**

This is a [broken]() link.

Here's a couple of images:
![image caption 1](${faker.image.urlPicsumPhotos({ height: 1500, width: 1800 })})
![image caption 2](${faker.image.urlPicsumPhotos({ height: 1500, width: 1800 })})
With some extra text inbetween
![image caption 3](${faker.image.urlPicsumPhotos({ height: 1500, width: 1800 })})

***

### More Tests

The following  
will be on separate  
lines.


## Code Content

${generateCodeSnippet()}

## Tables

${generateTable(3)}

## Custom Blocks

/// details | summary="${faker.lorem.lines(1)}" className=text-primary
${faker.lorem.paragraph()}
- this is 
- a simple 
- list thing
///

${generateLinkPreviewCustomBlock()}
`
}

export function generateMemo({ title, tags }: { title: string; tags: string[] }) {
    if (faker.number.float({ min: 0, max: 10 }) > 9.5) {
        return `${generateLinkPreviewCustomBlock()}
#${tags.join(" #")}`
    }

    return `# ${title}
#${tags.join(" #")}

${generateRealisticBody()}
`
}

export function generateRealisticBody(): string {
    let b = `${faker.lorem.paragraphs({ min: 1, max: 4 })}`

    if (faker.number.int({ min: 0, max: 10 }) > 3) {
        b += `

## ${generateTitle()}
${faker.lorem.paragraphs({ min: 1, max: 10 })}
`

        if (faker.number.int({ min: 0, max: 10 }) > 3) {
            b += `

${generateCodeSnippet()}
`
        }

        if (faker.number.int({ min: 0, max: 10 }) > 8) {
            b += `
${faker.lorem.paragraphs({ min: 1, max: 2 })}
${generateCodeSnippet()}
`
        }
    }

    if (faker.number.int({ min: 0, max: 10 }) > 3) {
        b += `
### ${generateTitle()}
${faker.lorem.paragraphs({ min: 1, max: 5 })}
`

        if (faker.number.int({ min: 0, max: 10 }) > 9) {
            b += `
${generateTable()}
`
        }
    }

    if (faker.number.int({ min: 0, max: 10 }) > 7) {
        b += `
#### ${generateTitle()}
${faker.lorem.paragraphs({ min: 1, max: 4 })}
`
    }

    return b
}

export function generateLinkPreviewCustomBlock(): string {
    return `
/// link-preview
[${faker.lorem.sentences(1)}](https://github.com/RobinThrift/conveyor)

![](${faker.image.urlPicsumPhotos({ width: 1200, height: 600 })})

${faker.lorem.sentences({ min: 1, max: 3 })}
///
`
}

export function generateTable(rows = 3): string {
    return `| left aligned | centre aligned | right aligned |
| :----------- | :------------: | ------------: |
${new Array(rows)
    .fill(undefined)
    .map(
        (_, i) =>
            `| _Cell_ A${i}      | Cell [B${i}](${faker.internet.url()})        | Cell **C${i}**       |`,
    )
    .join("\n")}
`
}

const exampleCodeSnippets = [
    `\`\`\`typescript
function parseMarkdown(raw: string): React.ReactNode | React.ReactNode[] {
    let ast = fromMarkdown(raw)
    return ast.children.map((c) => astNodeToJSX(c))
}
\`\`\``,
    `\`\`\`go
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
\`\`\``,
    `\`\`\`rust
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
\`\`\``,
    `\`\`\`python
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
\`\`\``,

    `\`\`\`bash
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
\`\`\``,

    `\`\`\`json
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
\`\`\``,
    `\`\`\`yaml
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
\`\`\``,
]

export function generateCodeSnippet(): string {
    return faker.helpers.arrayElement(exampleCodeSnippets)
}

export function generateTitle(): string {
    return faker.lorem
        .words({ min: 1, max: 5 })
        .split(" ")
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(" ")
}
