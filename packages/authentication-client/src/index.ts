import { AuthenticationClient, AuthenticationClientOptions } from './core';
import * as hooks from './hooks';
import { Application } from '@feathersjs/feathers';
import { AuthenticationResult, AuthenticationRequest } from '@feathersjs/authentication';
import { Storage, MemoryStorage, StorageWrapper } from './storage';

declare module '@feathersjs/feathers' {
  interface Application<ServiceTypes = any> {
    io?: any;
    rest?: any;
    primus?: any;
    authentication: AuthenticationClient;
    authenticate (authentication?: AuthenticationRequest): Promise<AuthenticationResult>;
    reAuthenticate (force: boolean): Promise<AuthenticationResult>;
    logout (): Promise<AuthenticationResult>;
  }
}

export { AuthenticationClient, AuthenticationClientOptions, Storage, MemoryStorage, hooks };

export type ClientConstructor = new (app: Application, options: AuthenticationClientOptions) => AuthenticationClient;

export const defaultStorage: Storage = typeof window !== 'undefined' ?
  new StorageWrapper(window.localStorage) : new MemoryStorage();

export const defaults: AuthenticationClientOptions = {
  header: 'Authorization',
  scheme: 'Bearer',
  storageKey: 'feathers-jwt',
  locationKey: 'access_token',
  locationErrorKey: 'error',
  jwtStrategy: 'jwt',
  path: '/authentication',
  Authentication: AuthenticationClient,
  storage: defaultStorage
};

const init = (_options: Partial<AuthenticationClientOptions> = {}) => {
  const options: AuthenticationClientOptions = Object.assign({}, defaults, _options);
  const { Authentication } = options;

  return (app: Application) => {
    const authentication = new Authentication(app, options);

    app.authentication = authentication;
    app.authenticate = authentication.authenticate.bind(authentication);
    app.reAuthenticate = authentication.reAuthenticate.bind(authentication);
    app.logout = authentication.logout.bind(authentication);

    app.hooks({
      before: {
        all: [
          hooks.authentication(),
          hooks.populateHeader()
        ]
      }
    });
  };
};

export default init;

if (typeof module !== 'undefined') {
  module.exports = Object.assign(init, module.exports);
}
