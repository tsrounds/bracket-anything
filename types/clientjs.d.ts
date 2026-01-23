declare module 'clientjs' {
  export class ClientJS {
    constructor();
    getFingerprint(): number;
    getUserAgent(): string;
    getBrowser(): string;
    getBrowserVersion(): string;
    getOS(): string;
    getOSVersion(): string;
    getDevice(): string;
    getDeviceType(): string;
    getCurrentResolution(): string;
    getTimeZone(): string;
    getLanguage(): string;
  }

  export default ClientJS;
}
