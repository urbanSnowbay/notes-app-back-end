const routes = (handler) => [
    {
        method: 'POST',
        path: '/collaborations',
        handler: handler.postCollaborationHandler,
        options: { 
            // options.auth: 'notesapp_jwt' nantinya pada proses menambahkan atau menghapus kolaborasi dibutuhkan informasi pengguna autentik untuk menentukan resource dapat diakses atau tidak.
            auth: 'notesapp_jwt',
        },
    },

    {
        method: 'DELETE',
        path: '/collaborations',
        handler: handler.deleteCollaborationHandler,
        options: {
            // options.auth: 'notesapp_jwt' nantinya pada proses menambahkan atau menghapus kolaborasi dibutuhkan informasi pengguna autentik untuk menentukan resource dapat diakses atau tidak.
            auth: 'notesapp_jwt',
        },
    },
];

module.exports = routes;