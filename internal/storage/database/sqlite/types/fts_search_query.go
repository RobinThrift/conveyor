package types

import (
	"strings"
	"unicode/utf8"
)

type ftsQuery struct {
	str  string
	l    int
	pos  int
	cur  rune
	prev rune
	end  bool

	o strings.Builder
}

func (q *ftsQuery) next() {
	if q.pos+1 >= q.l {
		q.end = true
		return
	}

	if q.pos == 0 && q.cur == 0 {
		q.cur = rune(q.str[q.pos])
		return
	}

	q.pos++
	q.prev = q.cur
	q.cur = rune(q.str[q.pos])
}

func (q *ftsQuery) outputCur() {
	runeLen := utf8.RuneLen(q.cur)
	q.o.WriteString(q.str[q.pos : q.pos+runeLen])
	q.pos += runeLen - 1
}

func (q *ftsQuery) consume() {
	q.next()
	if q.end {
		return
	}

	switch {
	case q.cur == '"':
		q.consumeQuoted()
	case q.cur == '*':
		q.o.WriteRune('*')
		q.consume()
	case q.cur == ' ':
		q.outputCur()
		q.consume()
	case (q.cur == 'N' || q.cur == 'n') && q.peekN(3) == "ot ":
		q.consumeNot()
	case (q.cur == 'A' || q.cur == 'a') && q.peekN(3) == "nd ":
		q.consumeAnd()
	case (q.cur == 'O' || q.cur == 'o') && q.peekN(2) == "r ":
		q.consumeOr()
	case (q.cur == '+') && q.peek(1) == ' ':
		q.consumePlus()
	default:
		q.consumeBare()
	}
}

func (q *ftsQuery) consumeNot() {
	q.next()
	q.next()
	q.next()
	q.o.WriteString("not ")
	q.consume()
}

func (q *ftsQuery) consumeAnd() {
	q.next()
	q.next()
	q.next()
	q.o.WriteString("and ")
	q.consume()
}

func (q *ftsQuery) consumeOr() {
	q.next()
	q.next()
	q.o.WriteString("or ")
	q.consume()
}

func (q *ftsQuery) consumePlus() {
	q.next()
	q.o.WriteString("+ ")
	q.consume()
}

func (q *ftsQuery) consumeBare() {
	q.o.WriteRune('"')
loop:
	for !q.end {
		switch {
		case q.cur == ' ' && q.peekN(4) == "and ":
			q.o.WriteRune('"')
			q.outputCur()
			break loop
		case q.cur == ' ' && q.peekN(4) == "not ":
			q.o.WriteRune('"')
			q.outputCur()
			break loop
		case q.cur == ' ' && q.peekN(3) == "or ":
			q.o.WriteRune('"')
			q.outputCur()
			break loop
		case q.cur == ' ' && q.peekN(2) == "+ ":
			q.o.WriteRune('"')
			q.outputCur()
			break loop
		case q.cur == ' ' && q.peek(1) == '"':
			q.o.WriteRune('"')
			q.outputCur()
			break loop
		case q.cur == '*':
			q.o.WriteRune('"')
			q.outputCur()
			return
		default:
			q.outputCur()
		}
		q.next()
	}

	if q.cur != ' ' {
		q.o.WriteRune('"')
	}

	q.consume()
}
func (q *ftsQuery) consumeQuoted() {
	for !q.end {
		q.outputCur()
		q.next()
		if q.cur == '"' {
			q.outputCur()
			break
		}
	}

	q.consume()
}

func (q *ftsQuery) peek(i int) rune {
	if q.pos+i >= q.l {
		return 0
	}
	return rune(q.str[q.pos+i])
}

func (q *ftsQuery) peekN(i int) string {
	if q.pos+i+1 >= q.l {
		return ""
	}
	return strings.ToLower(q.str[q.pos+1 : q.pos+i+1])
}

func PrepareFTSQueryString(str string) string {
	if str == "" {
		return ""
	}

	query := ftsQuery{str: str, l: len(str)}

	query.consume()

	return query.o.String()
}
