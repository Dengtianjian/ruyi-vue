export type TStorageHeaders = Record<string, string | number>;
export type TStorageQuery = Record<string, string | number>;

export type TStorageAccessControl = 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'authenticated-read-write';

export interface TStorageFile {
  id?: number,
  key: string,
  remote?: boolean,
  platform?: string,
  belongs_id?: string,
  belongs_type?: string,
  owner_id?: number,
  source_file_name: string,
  name: string,
  size: number,
  path?: string,
  width: number,
  height: number,
  extension: string,
  access_control: TStorageAccessControl,
  link: string,
  url: string,
  sort_order: number,
  created_at?: number,
  updated_at?: number
}

export type StorageSignParams = {
  "sign-algorithm": string,
  "sign-time": string,
  "key-time": string,
  "header-list": string,
  signature: string,
  "url-param-list": string
}