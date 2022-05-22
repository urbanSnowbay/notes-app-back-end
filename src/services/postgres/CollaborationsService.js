// CollaborationsService ini akan bertanggung jawab dalam menangani pengelolaan data pada tabel collaborations yang merupakan transaksi dari relasi many-to-many dari tabel notes dan users.

const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
    constructor(cacheService) {
        this._pool = new Pool();
        this._cacheService = cacheService;
    }

    async addCollaboration(noteId, userId) {
        // Di dalamnya, kita tuliskan kueri untuk memasukan nilai collaboration id, noteId, dan userId pada tabel collaborations. Untuk nilai id, kita manfaatkan nanoid untuk menciptakan id yang unik dan tambahkan prefix “collab-” agar tidak bias dengan nilai id notes ataupun users.
        const id = `collab-${nanoid(16)}`;

        const query = {
            text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
            // Karena pada addCollaboration perlu mengembalikan id dari collaboration (kebutuhan testing), jangan lupa RETURNING id pada teks kuerinya.
            values: [id, noteId, userId],
        };
        const result = await this._pool.query(query);

        // Cek nilai result.rows.length. Jika nilainya nol, maka throw InvariantError dengan pesan “Kolaborasi gagal ditambahkan”. Jika tidak, maka kembalikan fungsi addCollaboration dengan nilai result.rows[0].id.
        if (!result.rows.length) {
            throw new InvariantError('Kolaborasi gagal ditambahkan');
        }
        await this._cacheService.delete(`notes:${userId}`);
        return result.rows[0].id;
    }

    async deleteCollaboration(noteId, userId) {
        const query = {
            // Di dalamnya, kita tuliskan kueri untuk menghapus nilai collaboration--pada tabel collaborations--berdasarkan noteId dan userId yang diberikan di parameter.
            text: 'DELETE FROM collaborations WHERE note_id = $1 AND user_id = $2 RETURNING id',
            values: [noteId, userId],
        };
        const result = await this._pool.query(query);

        // Kemudian kita cek nilai result.rows.length. Jika nilainya nol, maka throw InvariantError dengan pesan “Kolaborasi gagal dihapus”.
        if (!result.rows.length) {
            throw new InvariantError('Kolaborasi gagal dihapus');
        }
        await this._cacheService.delete(`notes:${userId}`);
    }

    async verifyCollaborator(noteId, userId) {
        const query = {
            // Kemudian di dalamnya, lakukan kueri untuk memastikan kolaborasi dengan noteId dan userId yang diberikan di parameter yang ada di database.
            text: 'SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2',
            values: [noteId, userId],
        };
        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariantError('Kolaborasi gagal diverifikasi');
        }
    }
}

module.exports = CollaborationsService;