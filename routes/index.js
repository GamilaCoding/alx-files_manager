// eslint-disable-next-line no-unused-vars
import { Express } from 'express';
import * as AppController from '../controllers/AppController';
import * as AuthController from '../controllers/AuthController';
import * as UsersController from '../controllers/UsersController';
// import FilesController from '../controllers/FilesController';

/**
 * Injects routes with their handlers to the given Express application.
 * @param {Express} api
 */
const injectRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);

  api.get('/connect', AuthController.getConnect);
  api.get('/disconnect', AuthController.getDisconnect);

  api.post('/users', UsersController.postNew);
  api.get('/users/me', UsersController.getMe);

  // api.post('/files', xTokenAuthenticate, FilesController.postUpload);
  // api.get('/files/:id', xTokenAuthenticate, FilesController.getShow);
  // api.get('/files', xTokenAuthenticate, FilesController.getIndex);
  // api.put('/files/:id/publish', xTokenAuthenticate, FilesController.putPublish);
  // api.put('/files/:id/unpublish', xTokenAuthenticate, FilesController.putUnpublish);
  // api.get('/files/:id/data', FilesController.getFile);

};

export default injectRoutes;
