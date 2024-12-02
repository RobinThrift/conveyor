package filesystem

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"os"
	"path"

	"github.com/RobinThrift/belt/internal/domain"
)

type LocalFSAttachments struct {
	AttachmentsDir string
	TmpDir         string
}

func (lfs *LocalFSAttachments) WriteAttachment(_ context.Context, attachment *domain.Attachment, data io.Reader) (err error) {
	err = ensureDirExists(lfs.AttachmentsDir)
	if err != nil {
		return err
	}

	fhandle, err := os.CreateTemp(lfs.TmpDir, attachment.OriginalFilename)
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			err = errors.Join(err, fhandle.Close(), os.Remove(fhandle.Name()))
		}
	}()

	h := sha256.New()

	tee := io.TeeReader(data, h)

	attachment.SizeBytes, err = io.Copy(fhandle, tee)
	if err != nil {
		return err
	}

	attachment.Sha256 = h.Sum(nil)

	attachment.Filepath = ""
	for _, b := range attachment.Sha256 {
		attachment.Filepath = attachment.Filepath + "/" + fmt.Sprintf("%x", b)
	}

	attachment.Filepath = path.Join(attachment.Filepath, attachment.OriginalFilename)

	finalFilePath := path.Join(lfs.AttachmentsDir, attachment.Filepath)

	err = ensureDirExists(path.Dir(finalFilePath))
	if err != nil {
		return err
	}

	err = os.Rename(fhandle.Name(), finalFilePath)
	if err != nil {
		err = copyFile(fhandle, finalFilePath)
	}

	if err != nil {
		return err
	}

	return nil
}

func (lfs *LocalFSAttachments) RemoveAttachment(_ context.Context, attachment *domain.Attachment) error {
	filepath := path.Join(lfs.AttachmentsDir, attachment.Filepath)

	err := os.Remove(filepath)
	if err != nil {
		return err
	}

	dir := path.Dir(attachment.Filepath)
	for dir == "." || dir == "" || dir == "/" {
		isEmpty, err := isEmptyDir(dir)
		if err != nil {
			return err
		}

		if !isEmpty {
			return nil
		}

		err = os.RemoveAll(dir)
		if err != nil {
			return err
		}

		dir = path.Dir(dir)
	}

	return nil

}

func ensureDirExists(dir string) error {
	stat, err := os.Stat(dir)
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}

	if stat == nil {
		return os.MkdirAll(dir, 0755)
	}

	if !stat.IsDir() {
		return fmt.Errorf("%s exists but is not a directory", dir)
	}

	return nil
}

func isEmptyDir(dir string) (bool, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false, err
	}

	return len(entries) == 0, nil
}

func copyFile(fhandle *os.File, targetPath string) error {
	src, err := os.Open(fhandle.Name())
	if err != nil {
		return err
	}
	defer src.Close()

	target, err := os.OpenFile(targetPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}

	_, err = io.Copy(target, src)

	return errors.Join(err, target.Close())
}
