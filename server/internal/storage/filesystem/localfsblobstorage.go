package filesystem

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path"

	"go.robinthrift.com/belt/internal/domain"
)

type LocalFSBlobStorage struct {
	BaseDir string
	TmpDir  string
}

func (lfs *LocalFSBlobStorage) WriteBlob(accountID domain.AccountID, filepath string, data io.Reader) (n int64, err error) {
	fhandle, err := os.CreateTemp(lfs.TmpDir, fmt.Sprintf("%d_%s", accountID, path.Base(filepath)))
	if err != nil {
		return 0, err
	}

	defer func() {
		if err != nil {
			err = errors.Join(err, fhandle.Close(), os.Remove(fhandle.Name()))
		}
	}()

	n, err = io.Copy(fhandle, data)
	if err != nil {
		return 0, err
	}

	finalFilePath := path.Join(lfs.BaseDir, fmt.Sprint(accountID), filepath)

	err = ensureDirExists(path.Dir(finalFilePath))
	if err != nil {
		return 0, err
	}

	err = os.Rename(fhandle.Name(), finalFilePath)
	if err != nil {
		// error when transferring across file systems, fallback to simple copy
		err = copyFile(fhandle, finalFilePath)
	}

	if err != nil {
		return 0, err
	}

	return n, nil
}

func (lfs *LocalFSBlobStorage) RemoveBlob(accountID domain.AccountID, filepath string) error {
	fullFilepath := path.Join(lfs.BaseDir, fmt.Sprint(accountID), filepath)

	err := os.Remove(fullFilepath)
	if err != nil {
		return err
	}

	dir := path.Dir(fullFilepath)
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
