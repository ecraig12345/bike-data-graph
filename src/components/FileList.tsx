import React from 'react';
import { Link } from '@fluentui/react/lib/Link';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { fetcher } from '../utils/fetcher';
import { FilesData } from '../utils/types';

export type FileListProps = {
  onFileSelected: (filePath: string) => void;
};

type File = { name: string; onClick: (ev: React.MouseEvent) => void };
type Folder = { name: string; files: File[] };

type ListFoldersResult = { folders?: Folder[]; error?: string };

const styles = mergeStyleSets({
  root: {
    width: '100%',
    '*': { lineHeight: '1.5em' },
    ul: { marginTop: '0.2em' },
    summary: { cursor: 'pointer' },
  },
  error: { color: 'red' },
});

async function listFolders(props: FileListProps) {
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
        props.onFileSelected(`${folder.name}/${file}`);
      },
    })),
  }));
  return { folders };
}

const FileList: React.FunctionComponent<FileListProps> = (props) => {
  const [{ folders, error }, setListFoldersResult] = React.useState<ListFoldersResult>({});

  React.useEffect(() => {
    // fetch list of files on mount
    listFolders(props).then((res) => {
      setListFoldersResult(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.root}>
      {folders ? (
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
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <Spinner label="Loading..." size={SpinnerSize.large} />
      )}
    </div>
  );
};

export default FileList;
