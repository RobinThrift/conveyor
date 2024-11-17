package jobs

import (
	"context"
)

type Job interface{ Exec(context.Context) error }
