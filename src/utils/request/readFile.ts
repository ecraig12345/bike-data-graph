/** Read from a browser file object */
export default function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onabort = () => reject('File reading aborted');
    reader.onerror = () => reject('Error reading file');
    reader.onload = () => {
      const result =
        typeof reader.result === 'string'
          ? reader.result
          : new TextDecoder('utf-8').decode(reader.result as ArrayBuffer);
      resolve(result);
    };

    reader.readAsArrayBuffer(file);
  });
}
