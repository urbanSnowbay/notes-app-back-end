/* eslint-disable camelcase */

exports.shorthands = undefined;

// Berdasarkan dokumentasi dari node-pg-migrate, untuk menambahkan kolom pada tabel yang sudah ada, kita bisa menggunakan perintah pgm.addColumn, dan untuk menghapusnya gunakan perintah pgm.dropColumn.

exports.up = (pgm) => {
    pgm.addColumn('notes', {
        owner: {
            type: 'VARCHAR(50)',
        },
    });
};

exports.down = (pgm) => {
    pgm.dropColumn('notes', 'owner');
};
