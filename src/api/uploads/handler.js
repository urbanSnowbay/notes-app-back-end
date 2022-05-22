const ClientError = require('../../exceptions/ClientError');

class UploadsHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
    }

    async postUploadImageHandler(request, h) {
        try {
            // dapatkan dulu data pada request.payload yang merupakan Readable.
            const { data } = request.payload;
            // validasi nilai data.hapi.headers menggunakan this._validator.validateImageHeaders. Hal ini bertujuan untuk memastikan objek headers memiliki content-type yang sesuai.
            this._validator.validateImageHeaders(data.hapi.headers);

            // Setelah melalui proses validasi, kita bisa yakin data yang dikirim oleh client merupakan gambar. Dengan begitu, kita bisa langsung tulis berkas yang dikirim pada storage melalui fungsi this._service.writeFile. Berikan data sebagai parameter file dan data.hapi sebagai parameter meta.
            const filename = await this._service.writeFile(data, data.hapi);

            // Jangan lupa bahwa fungsi writeFile mengembalikan nama berkas (filename) yang ditulis. Kita bisa memanfaatkan nama berkas ini dalam membuat nilai fileLocation dan mengembalikannya sebagai response.
            const response = h.response({
                status: 'success',
                data: {
                    fileLocation: `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`,
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
}

module.exports = UploadsHandler;