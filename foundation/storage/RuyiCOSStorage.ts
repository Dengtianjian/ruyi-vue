import { TStorageAccessControl, TStorageHeaders, TStorageQuery } from "../../types/storageTypes";
import { RuyiRemoteStorage } from "./RuyiRemoteStorage";
import COS from "cos-js-sdk-v5";

export type TMPQCloudCOSTempAuthInfo = {
  TmpSecretId: string,
  TmpSecretKey: string,
  SecurityToken: string,
  StartTime: number,
  ExpiredTime: number,
  ScopeLimit?: boolean
}
export type TMPQCloudCOSAuthrozation = {
  Authorization: string
};

export class RuyiCOSStorage extends RuyiRemoteStorage<COS> {
  /**
   * 对象授权信息
   */
  protected ObjectAuthorization: Map<string, Record<string, COS.GetAuthorizationCallbackParams>> = new Map();
  /**
   * 操作完成后需要移除授权信息的对象键名集
   */
  protected RemoveAfterUsingObject: Set<string> = new Set();
  /**
   * 实例化腾讯云COS
   * @param Region 存储桶所在地域
   * @param Bucket 存储桶名称
   */
  constructor(Region: string = null, Bucket: string = null) {
    super(Region, Bucket);

    this.SDKClient = new COS({
      getAuthorization: (options: COS.GetAuthorizationOptions, callback: (params: COS.GetAuthorizationCallbackParams) => void) => {
        const Method: string = options.Method.toString().toLowerCase();

        let objectKey: string = options.Key;
        if (!objectKey) {
          if (options.Query.prefix?.toString()) {
            objectKey = options.Query.prefix.toString();
          }
        }

        if (objectKey) {
          const HTTPMethodAuths = this.ObjectAuthorization.get(objectKey);

          let auth: COS.GetAuthorizationCallbackParams = null;
          if (typeof HTTPMethodAuths === 'string') {
            auth = HTTPMethodAuths;
          } else if (HTTPMethodAuths[Method]) {
            auth = HTTPMethodAuths[Method];
          } else {
            console.error(HTTPMethodAuths);
          }

          callback(auth);

          // this.ObjectAuthorization.clear();
          // this.RemoveAfterUsingObject.clear();
        } else {
          console.error(options);
        }
      }
    });
  }
  /**
   * 设置对象授权信息。每次对象操作时都需要用到不同的授权信息，例如上传对象、删除对象、获取对象等。该方法用于在这些操作前调用接口获取到授权信息后传入该方法对应的参数中，以便继续操作后使用授权信息
   * @param objectKey string 对象键名
   * @param auth object 操作对象的授权信息
   * @param removeAfterUsing boolean 操作后移除对象授权信息
   * @param httpMethod string 请求方式
   * @returns this
   */
  objectAuthorization(objectKey: string, auth: COS.GetAuthorizationCallbackParams, removeAfterUsing: boolean = true, httpMethod: string = null) {
    if (httpMethod) {
      httpMethod = httpMethod.toString().toLowerCase();

      if (this.ObjectAuthorization.has(objectKey)) {
        const HTTPMethodAuths = this.ObjectAuthorization.get(objectKey);
        HTTPMethodAuths[httpMethod] = auth;
        this.ObjectAuthorization.set(objectKey, HTTPMethodAuths);
      } else {
        this.ObjectAuthorization.set(objectKey, {
          [httpMethod]: auth
        });
      }
    }

    removeAfterUsing && this.RemoveAfterUsingObject.add(objectKey);

    return this;
  }
  /**
   * 上传文件
   * @param objectKey string 对象键名
   * @param file File 上传的文件
   * @param string string 对象访问控制
   * @param number SliceSize 表示文件大小超出一个数值时使用分块上传，单位 Byte，默认值5242880（5MB），小于等于该数值会使用 putObject 上传，大于该数值会使用 sliceUploadFile 上传
   * @param number AsyncLimit 分块的并发量，仅在触发分块上传时有效
   * @returns Promise<string> 对象访问地址
   */
  uploadFile(objectKey: string, file: File, AC: TStorageAccessControl, SliceSize: number = 1024 * 1024 * 5, AsyncLimit: number = 10): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const Headers: TStorageHeaders = {};

      if (AC) {
        Headers['x-cos-acl'] = AC;
      }

      this.SDKClient.uploadFile({
        Bucket: this.bucket(),
        Region: this.region(),
        Key: objectKey,
        Body: file,
        Headers,
        SliceSize,
        AsyncLimit
      }, (err, data) => {
        if (err) {
          reject(err.error);
        } else {
          resolve(data.Location);
        }
        if (this.RemoveAfterUsingObject.has(objectKey)) {
          this.RemoveAfterUsingObject.delete(objectKey);
          this.ObjectAuthorization.delete(objectKey);
        }
      });
    });
  }
  /**
   * 获取对象访问 URL
   * @param Key string 对象键名
   * @param Query object 签名中要签入的请求参数，{key: 'val'} 的格式
   * @param Expires number Url中的签名几秒后失效，默认为 900 秒
   * @returns string 计算得到的 Url
   */
  getObjectURL(Key: string, Query: TStorageQuery = {}, Expires: number = null): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.SDKClient.getObjectUrl({
        Bucket: this.bucket(),
        Region: this.region(),
        Key,
        Expires,
        Query
      }, (err, data) => {
        if (err) {
          reject(err);
        } {
          resolve(data.Url);
        }
      });
    });
  }
}