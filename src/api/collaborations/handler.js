const ClientError = require('../../exceptions/ClientError');

class CollaborationHandler {
    constructor(collaborationsService, notesService, validator) {
        this._collaborationsService = collaborationsService;
        this._notesService = notesService;
        this._validator = validator;

        this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
        this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
    }

    async postCollaborationHandler(request, h) {
        // Fungsi handler ini bertugas untuk menangani permintaan POST yang masuk ke /collaborations. Permintaan tersebut seharusnya membawa payload noteId dan userId pada body. Jadi untuk memastikan hal tersebut, kita awali dengan memvalidasi request.payload menggunakan fungsi this._validator.validateCollaborationPayload.
        try {
            this._validator.validateCollaborationPayload(request.payload);

            // Setelah request.payload melalui proses validasi, kita bisa aman untuk menggunakan payload tersebut. Namun perlu diingat, sebelum menambahkan kolaborator pada catatan, pengguna yang mengajukan permintaan haruslah owner dari catatan tersebut.Untuk memastikan hal itu, kita perlu verifikasi request.auth.credentials.id dan noteId yang berada di request.payload menggunakan fungsi this._notesService.verifyNoteOwner.
            const { id: credentialId } = request.auth.credentials;
            const { noteId, userId } = request.payload;

            await this._notesService.verifyNoteOwner(noteId, credentialId);

            // Setelah memastikan pengguna adalah owner dari catatan, selanjutnya kita bisa aman untuk menambahkan kolaborasi pada catatan tersebut. Silakan panggil fungsi this._collaborationsService.addCollaboration dengan membawa nilai noteId dan userId.
            const collaborationId = await this._collaborationsService.addCollaboration(noteId, userId);

            // Ingat! Karena fungsi addCollaboration mengembalikan collaboration id yang dimasukkan, maka tampung nilainya pada variabel collaborationId dan gunakan nilainya sebagai data respons.
            const response = h.response({
                status: 'success',
                message: 'Kolaborasi berhasil ditambahkan',
                data: {
                    collaborationId,
                },
            });
            response.code(201);
            return response;
        } catch (error) {
            if (error instanceof ClientError) {
                const response = h.response({
                    status: 'fail',
                    message: error.message,
                });
                response.code(error.statusCode);
                return response;
            }

            // Server ERROR!
            const response = h.response({
                status: 'error',
                message: 'Maaf, terjadi kegagalan pada server kami.',
            });
            response.code(500);
            console.error(error);
            return response;
        }
    }

    // postCollaborationHandler dan deleteCollaborationHandler memiliki alur yang sama. Hanya kita perlu mengubah pemanggilan fungsi addCollaboration ke deleteCollaboration saja, dan fungsi tersebut juga tidak mengembalikan nilai.
    async deleteCollaborationHandler(request, h) {
        try {
            this._validator.validateCollaborationPayload(request.payload);
            const { id: credentialId } = request.auth.credentials;
            const { noteId, userId } = request.payload;

            await this._notesService.verifyNoteOwner(noteId, credentialId);
            await this._collaborationsService.deleteCollaboration(noteId, userId);

            return {
                status: 'success',
                message: 'Kolaborasi berhasil dihapus',
            };
        } catch (error) {
            if (error instanceof ClientError) {
                const response = h.response({
                    status: 'fail',
                    message: error.message,
                });
                response.code(error.statusCode);
                return response;
            }
              // Server ERROR!
            const response = h.response({
                status: 'error',
                message: 'Maaf, terjadi kegagalan pada server kami.',
            });
            response.code(500);
            console.error(error);
            return response;
        }
    }
}

module.exports = CollaborationHandler;