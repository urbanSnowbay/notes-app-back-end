const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel } = require('../../utils');

class NotesService {
    constructor() {
        this._pool = new Pool();
    }

    async addNote({ title, body, tags }) {
        const id = nanoid(16);
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        // Selanjutnya buat objek query untuk memasukan notes baru ke database seperti ini.
        const query = {
            text: 'INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
            values: [id, title, body, tags, createdAt, updatedAt], 
        };

        // Untuk mengeksekusi query yang sudah dibuat, kita gunakan fungsi this._pool.query.
        const result = await this._pool.query(query);

        // Jika nilai id tidak undefined, itu berarti catatan berhasil dimasukan dan kembalikan fungsi dengan nilai id. Jika tidak maka throw InvariantError.
        if (!result.rows[0].id) {
            throw new InvariantError('Catatan gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getNotes() {
        // Di dalamnya kita dapatkan seluruh data notes yang ada di database dengan query “SELECT * FROM notes”.
        const result = await this._pool.query('SELECT * FROM notes');
        // Kembalikan fungsi getNotes dengan nilai result.rows yang telah di mapping dengan fungsi mapDBToModel.
        return result.rows.map(mapDBToModel);
    }

    async getNoteById(id) {
        const query = {
            text: 'SELECT * FROM notes WHERE id = $1',
            values: [id],
        };
        const result = await this._pool.query(query);

        // Kemudian periksa nilai result.rows, bila nilainya 0 (false) maka bangkitkan NotFoundError
        if (!result.rows.length) {
            throw new NotFoundError('Catatan tidak ditemukan');
        }

        // Bila tidak, maka kembalikan dengan result.rows[0] yang sudah di-mapping dengan fungsi mapDBToModel.
        return result.rows.map(mapDBToModel)[0];
    }

    async editNoteById(id, { title, body, tags }) {
        // lakukan query untuk mengubah note di dalam database berdasarkan id yang diberikan.
        const updatedAt = new Date().toISOString();
        const query = {
            text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id',
            values: [title, body, tags, updatedAt, id],
        };

        const result = await this._pool.query(query);

        // periksa nilai result.rows bila nilainya 0 (false) maka bangkitkan NotFoundError.
        if (!result.rows.length) {
            throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
        } 
    }

    async deleteNoteById(id) {
        // Lakukan query untuk menghapus note di dalam database berdasarkan id yang diberikan.
        const query = {
            text: 'DELETE FROM notes WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);

        // periksa nilai result.rows bila nilainya 0 (false) maka bangkitkan NotFoundError. 
        if (!result.rows.length) {
            throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
        }
    }
}

module.exports = NotesService;