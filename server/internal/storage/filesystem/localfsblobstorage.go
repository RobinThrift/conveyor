package filesystem

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path"

	"go.robinthrift.com/belt/internal/domain"
	"go.robinthrift.com/belt/internal/storage"
)

type LocalFSBlobStorage struct {
	BaseDir string
	TmpDir  string
}

func (lfs *LocalFSBlobStorage) WriteBlob(accountID domain.AccountID, filepath string, data io.Reader) (n int64, err error) {
	target, err := lfs.OpenBlobTarget(accountID, filepath)
	if err != nil {
		return 0, err
	}

	defer func() {
		err = errors.Join(err, target.Close())
	}()

	n, err = io.Copy(target, data)
	if err != nil {
		return 0, err
	}

	err = target.Finalize(filepath)
	if err != nil {
		return 0, err
	}

	return n, nil
}

func (lfs *LocalFSBlobStorage) OpenBlobTarget(accountID domain.AccountID, originalFilename string) (storage.BlobTarget, error) {
	fhandle, err := os.CreateTemp(lfs.TmpDir, fmt.Sprintf("%d_%s-*", accountID, path.Base(originalFilename)))
	if err != nil {
		return nil, fmt.Errorf("error creating temporary file: %w", err)
	}

	return &BlobTarget{
		f:       fhandle,
		baseDir: path.Join(lfs.BaseDir, fmt.Sprint(accountID)),
	}, nil
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

type BlobTarget struct {
	f       *os.File
	baseDir string
}

func (bt *BlobTarget) Write(b []byte) (int, error) {
	return bt.f.Write(b)
}

func (bt *BlobTarget) Close() error {
	if bt.f != nil {
		return errors.Join(bt.f.Close(), os.Remove(bt.f.Name()))
	}
	return nil
}

func (bt *BlobTarget) Finalize(filepath string) (err error) {
	finalFilePath := path.Join(bt.baseDir, filepath)

	err = ensureDirExists(path.Dir(finalFilePath))
	if err != nil {
		return err
	}

	err = bt.f.Close()
	if err != nil {
		return fmt.Errorf("error closing temporary file: %w", err)
	}

	err = os.Rename(bt.f.Name(), finalFilePath)
	if err != nil {
		// error when transferring across file systems, fallback to simple copy
		err = copyFile(bt.f, finalFilePath)
	}

	if err != nil {
		return fmt.Errorf("error moving data to final location: %w", err)
	}

	bt.f = nil

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
