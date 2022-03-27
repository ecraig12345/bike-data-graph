import React from 'react';
import { Link } from '@fluentui/react/lib/Link';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { fetcher } from '../../utils/request/fetcher';
import { FilesData } from '../../types';
import Details from '../basic/Details';
import Error from '../basic/Error';

export type LocalFileListProps = {
  className?: string;
  onFileSelected: (filePath: string) => void;
};

type File = { name: string; onClick: (ev: React.MouseEvent) => void };
type Folder = { name: string; files: File[] };

type ListFoldersResult = { folders?: Folder[]; error?: string };

const rootClass = mergeStyles({
  width: '100%',
  '*': { lineHeight: '1.5em' },
  ul: { marginTop: '0.2em' },
});

async function listFolders(onFileSelected: LocalFileListProps['onFileSelected']) {
  let data: FilesData;
  try {
    data = await fetcher('api/files');
  } catch (error) {
    return { error: (error as Error).message || String(error) };
  }

  const folders: Folder[] = data.map((folder) => ({
    name: folder.name,
    files: folder.files.map((file) => ({
      name: file,
      onClick: (ev) => {
        ev.preventDefault();
        onFileSelected(`${folder.name}/${file}`);
      },
    })),
  }));
  return { folders };
}

const LocalFileList: React.FunctionComponent<LocalFileListProps> = (props) => {
  const { onFileSelected } = props;
  const [hasOpened, setHasOpened] = React.useState(false);
  const [{ folders, error: listFoldersError }, setListFoldersResult] =
    React.useState<ListFoldersResult>({});

  const onOpenChange = () => {
    !hasOpened && setHasOpened(true);
  };

  React.useEffect(() => {
    if (hasOpened && !folders) {
      // fetch list of files on first open
      listFolders(onFileSelected).then((res) => {
        setListFoldersResult(res);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOpened]);

  return (
    <Details
      summary="List local data files"
      defaultIsOpen={false}
      onOpenChange={onOpenChange}
      className={rootClass}
    >
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
      ) : listFoldersError ? (
        <Error>{listFoldersError}</Error>
      ) : (
        <Spinner label="Loading..." size={SpinnerSize.large} />
      )}
    </Details>
  );
};

export default LocalFileList;
