package stringset

var m = struct{}{}

type Set map[string]struct{}

func New(v ...string) Set {
	s := Set(map[string]struct{}{})
	s.Add(v...)
	return s
}

func (s Set) Add(strs ...string) {
	for _, str := range strs {
		s[str] = m
	}
}

func (s Set) Del(str string) {
	delete(s, str)
}

func (s Set) Has(str string) bool {
	_, ok := s[str]
	return ok
}

func (s Set) Values() []string {
	vals := make([]string, 0, len(s))

	for k := range s {
		vals = append(vals, k)
	}

	return vals
}
