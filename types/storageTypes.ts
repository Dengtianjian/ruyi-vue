export type TStorageHeaders = Record<string, string | number>;
export type TStorageQuery = Record<string, string | number>;

export type TStorageAccessControl = 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'authenticated-read-write';

export interface TStorageFileInfo {
  id?: number,
  key: string,
  remote: boolean,
  belongsId: string,
  belongsType: string,
  ownerId: number,
  sourceFileName: string,
  name: string,
  size: number,
  path: string,
  width: number,
  height: number,
  extension: string,
  accessControl: TStorageAccessControl,
  createdAt?: number,
  updatedAt?: number,

  previewURL?: string,
  downloadURL?: string,
  remotePreviewURL?: string,
  downloadDownloadURL?: string
}