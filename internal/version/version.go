package version

import (
	"runtime"
	"runtime/debug"
	"sync"
)

var Version = "dev"

type BuildInfo struct {
	Version   string
	Hash      string
	Date      string
	GoVersion string
}

var buildInfo BuildInfo

var once sync.Once

func GetBuildInfo() *BuildInfo {
	once.Do(func() {
		buildInfo.Version = Version
		buildInfo.GoVersion = runtime.Version()
		if info, ok := debug.ReadBuildInfo(); ok {
			for _, setting := range info.Settings {
				switch setting.Key {
				case "vcs.revision":
					buildInfo.Hash = setting.Value
				case "vcs.time":
					buildInfo.Date = setting.Value
				}
			}
		}
	})

	return &buildInfo
}
