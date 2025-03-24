package testhelper

import (
	"bytes"
	"io"
	"testing"

	"filippo.io/age"
)

func AgeEncrypt(t *testing.T, publicKey string, data []byte) []byte {
	t.Helper()

	recipient, err := age.ParseX25519Recipient(publicKey)
	if err != nil {
		t.Fatal(err)
	}

	var encrypted bytes.Buffer

	encrypter, err := age.Encrypt(&encrypted, recipient)
	if err != nil {
		t.Fatal(err)
	}

	_, err = encrypter.Write(data)
	if err != nil {
		t.Fatal(err)
	}

	err = encrypter.Close()
	if err != nil {
		t.Fatal(err)
	}

	return encrypted.Bytes()
}

func AgeDecrypt(t *testing.T, privateKey string, data io.Reader) []byte {
	t.Helper()

	ident, err := age.ParseX25519Identity(privateKey)
	if err != nil {
		t.Fatal(err)
	}

	decrypter, err := age.Decrypt(data, ident)
	if err != nil {
		t.Fatal(err)
	}

	decrypted, err := io.ReadAll(decrypter)
	if err != nil {
		t.Fatal(err)
	}

	return decrypted
}
