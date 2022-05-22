const path = require('path');

const routes = (handler) => [
    {
        method: 'POST',
        path: '/upload/images',
        handler: handler.postUploadImageHandler,
        options: {
            payload: {
                // Ketika menetapkan options.payload.allow dengan multipart/form-data, dan options.payload.multipart dengan nilai true, sekarang request hanya boleh diterima jika payload-nya merupakan form-data. 
                allow: 'multipart/form-data',
                multipart: true,
                // Di Hapi, kita juga bisa mengubah Buffer menjadi Readable Stream secara mudah hanya dengan menambahkan nilai “stream” pada properti options.payload.output pada route configuration. Maka yang sebelumnya data merupakan Buffer, ia akan berubah menjadi stream.Readable:
                output: 'stream',
            },
        },
    },
    {
        method: 'GET',
        path: '/upload/{param*}',
        handler: {
            directory: {
                // Dengan begitu, bila ada permintaan masuk ke GET /upload/*, maka akan dilayani oleh berkas statis yang berada di dalam folder file sesuai dengan parameter yang diminta client.
                path: path.resolve(__dirname, 'file'),
            },
        },
    },
];

module.exports = routes;