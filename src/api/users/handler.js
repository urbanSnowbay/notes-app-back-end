const ClientError = require('../../exceptions/ClientError');

class UsersHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        // Binding nilai this pada setiap fungsi, agar nilainya tetap instance dari UsersHandler.
        this.postUserHandler = this.postUserHandler.bind(this);
        this.getUserByIdHandler = this.getUserByIdHandler.bind(this);
    }

    async postUserHandler(request, h) {
        try { // Pertama, ketika client mengirimkan POST /users, kita perlu validasi dulu request.payload atau objek user yang dikirim
            this._validator.validateUserPayload(request.payload);
            // Setelah payload divalidasi, kemudian properti user seperti 'username', 'password', 'fullname' sudah aman untuk diinput ke database. Dan kita bisa mendapatkan properti tersebut dari request.payload
            const { username, password, fullname } = request.payload;

            // panggil fungsi addUser dari this._service untuk memasukkan user baru. Karena fungsi addUser mengembalikan id dari user yang dimasukan, jadi kita bisa mendapatkan userId dari sana. 
            const userId = await this._service.addUser({ username, password, fullname });

            // Setelah memasukkan user baru, kemudian kembalikan request dengan response code 201. Serta membawa user id pada response body-nya.
            const response = h.response({
                status: 'success',
                message: 'User berhasil ditambahkan',
                data: {
                    userId,
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

    async getUserByIdHandler(request, h) {
        try { // Dapatkan nilai id (user) dari request.params.
            const { id } = request.params;

            // Dapatkan user berdasarkan id tersebut dari database melalui fungsi this._service.getUserById. 
            const user = await this._service.getUserById(id);

            // Kembalikan fungsi handler dengan response sukses dengan membawa user sebagai datanya
            return {
                status: 'success',
                data: {
                    user,
                },
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

module.exports = UsersHandler;