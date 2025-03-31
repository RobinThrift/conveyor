package jobs

import (
	"context"
	"encoding/json"
	"fmt"

	"go.robinthrift.com/conveyor/internal/domain"
)

type JobKind[T any] interface {
	Exec(ctx context.Context, data T) (*domain.JobResult, error)
}

type JobKindWithJSONData JobKind[[]byte]

type jobKindeWithJSONData[T any] struct {
	k JobKind[T]
}

func NewJobKindWithJSONData[T any](kind JobKind[T]) JobKindWithJSONData {
	return &jobKindeWithJSONData[T]{kind}
}

func (e *jobKindeWithJSONData[T]) Exec(ctx context.Context, raw []byte) (*domain.JobResult, error) {
	var data T

	err := json.Unmarshal(raw, &data)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling job data JSON: %w", err)
	}

	return e.k.Exec(ctx, data)
}
