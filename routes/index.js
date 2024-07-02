// eslint-disable-next-line no-unused-vars
import { Express } from 'express';
import * as AppController from '../controllers/AppController';
import * as AuthController from '../controllers/AuthController';
import * as UsersController from '../controllers/UsersController';
import * as FilesController from '../controllers/FilesController';


const injectRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);

  api.get('/connect', AuthController.getConnect);
  api.get('/disconnect', AuthController.getDisconnect);

  api.post('/users', UsersController.postNew);
  api.get('/users/me', UsersController.getMe);

  api.post('/files', FilesController.postUpload);
  api.get('/files/:id', FilesController.getShow);
  api.get('/files', FilesController.getIndex);
  // api.put('/files/:id/publish', xTokenAuthenticate, FilesController.putPublish);
  // api.put('/files/:id/unpublish', xTokenAuthenticate, FilesController.putUnpublish);
  // api.get('/files/:id/data', FilesController.getFile);
};

export default injectRoutes;
