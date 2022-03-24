import React from 'react';
import { Link } from '@fluentui/react/lib/Link';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { fetcher } from '../utils/fetcher';
import { FilesData } from '../utils/types';
import styles from '../styles/FileList.module.css';
import { useStore } from '../utils/useStore';

type File = { name: string; onClick: (ev: React.MouseEvent) => void };
type Folder = { name: string; files: File[] };

type GetAllFilesResult = { folders?: Folder[]; error?: string };

async function getAllFiles(setIsFetching: (isFetching: boolean) => void) {
  let data: FilesData;
  try {
    data = await fetcher('api/files');
  } catch (error) {
    return { error: String(error) };
  }

  const folders: Folder[] = data.map((folder) => ({
    name: folder.name,
    files: folder.files.map((file) => ({
      name: file,
      onClick: (ev) => {
        ev.preventDefault();
        setIsFetching(true);
        useStore.getState().fetchFile(`${folder.name}/${file}`);
      },
    })),
  }));
  return { folders };
}

const FileList: React.FunctionComponent = () => {
  const [{ folders, error }, setResult] = React.useState<GetAllFilesResult>({});
  const [isFetching, setIsFetching] = React.useState(true);

  React.useEffect(() => {
    // fetch list of files on mount
    getAllFiles(setIsFetching).then((res) => {
      setResult(res);
      setIsFetching(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.root}>
      {isFetching ? (
        <Spinner label="Loading..." size={SpinnerSize.large} />
      ) : folders ? (
        folders.map((folder) => (
          <details key={folder.name}>
            <summary>{folder.name}</summary>
            <ul>
              {folder.files.map((file) => (
                <li key={file.name}>
                  <Link onClick={file.onClick}>{file.name}</Link>
                </li>
              ))}
            </ul>
          </details>
        ))
      ) : (
        error
      )}
    </div>
  );
};

export default FileList;
