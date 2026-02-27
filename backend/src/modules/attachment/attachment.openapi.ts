import { CreateSignRoute } from './openapis/createsign.route';
import { DeleteRoute } from './openapis/delete.route';
import { DownloadRoute } from './openapis/download.router';
import { ListAttachmentRoute } from './openapis/list.router';
import { UploadRoute } from './openapis/upload.route';

export function  FileOpenApi(openapi: any, authMiddleware: any, requirePermission: any) {
    openapi.post('/api/attachment/upload', authMiddleware, UploadRoute);
    openapi.post('/api/attachment/createsign', authMiddleware, CreateSignRoute);
    openapi.get('/api/attachment/:path', DownloadRoute);
    openapi.post('/api/attachment/list', authMiddleware, ListAttachmentRoute);
    openapi.delete('/api/attachment/delete/:ids', authMiddleware, DeleteRoute);
}