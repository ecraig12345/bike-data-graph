import React from 'react';
import useSWR from 'swr';
import { Link } from '@fluentui/react/lib/Link';
import { FilesData } from '../utils/types';
import styles from '../styles/FileList.module.css';

type File = { name: string; onClick: (ev: React.MouseEvent) => void };
type Folder = { name: string; files: File[] };

export type FileListProps = {
  onFileSelected: (filePath: string) => void;
};

const FileList: React.FunctionComponent<FileListProps> = (props) => {
  const { onFileSelected } = props;
  const { data, error } = useSWR<FilesData, string>('api/files', {
    revalidateOnFocus: false, // https://swr.vercel.app/docs/revalidation
    revalidateOnReconnect: false,
  });

  const folders: Folder[] | undefined = React.useMemo(() => {
    if (error || !data) {
      return undefined;
    }

    return data.map((folder) => ({
      name: folder.name,
      files: folder.files.map((file) => ({
        name: file,
        onClick: (ev) => {
          ev.preventDefault();
          onFileSelected(`${folder.name}/${file}`);
        },
      })),
    }));
  }, [data, error, onFileSelected]);

  return (
    <div className={styles.root}>
      {folders
        ? folders.map((folder) => (
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
        : error || 'Loading...'}
    </div>
  );
};

export default FileList;
