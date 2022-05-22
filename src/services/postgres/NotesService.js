const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel } = require('../../utils');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class NotesService {
    // Dalam melakukan tugasnya, fungsi verifyNoteAccess mengandalkan fungsi verifyCollaborator yang dimiliki oleh CollaborationsService. Dengan begitu kita perlu menambahkan dependency terhadap CollaborationsService di dalam NotesService.
    constructor(collaborationService, cacheService) {
        this._pool = new Pool();
        this._collaborationService = collaborationService;
        this._cacheService = cacheService;
    }

    // Pertama pada fungsi addNote, tambahkan properti owner pada parameter objek note. Kemudian, sesuaikan kueri dengan menambahkan nilai owner seperti ini:
    async addNote({ 
        title, body, tags, owner, 
    }) {
        const id = nanoid(16);
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        // Selanjutnya buat objek query untuk memasukan notes baru ke database seperti ini.
        const query = {
            text: 'INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            values: [id, title, body, tags, createdAt, updatedAt, owner], 
        };
        // Sekarang, setiap ada catatan yang masuk maka kolom owner akan ikut terisi. Dengan begitu, kita jadi tahu siapa pemilik dari catatan tersebut.

        // Untuk mengeksekusi query yang sudah dibuat, kita gunakan fungsi this._pool.query.
        const result = await this._pool.query(query);

        // Jika nilai id tidak undefined, itu berarti catatan berhasil dimasukan dan kembalikan fungsi dengan nilai id. Jika tidak maka throw InvariantError.
        if (!result.rows[0].id) {
            throw new InvariantError('Catatan gagal ditambahkan');
        }

        // fungsi this._cacheService.delete berfungsi untuk menghapus cache ketika terjadi perubahan data
        await this._cacheService.delete(`notes:${owner}`);

        return result.rows[0].id;
    }

    // Fungsi getNotes tidak akan mengembalikan seluruh catatan yang disimpan pada tabel notes. Melainkan hanya catatan yang dimiliki oleh owner saja.
    async getNotes(owner) {
        try {
            // mendapatkan catatan dari cache
            // dalam menetapkan nilai key di cache, kita menggunakan userId (owner) dengan prefix notes:. Dengan begitu, cache akan menyimpan data catatan setiap pengguna secara unik dan terhindar dari tumpang tindih.
            const result = await this._cacheService.get(`notes:${owner}`);
            return JSON.parse(result);
        } catch (error) {
            // bila gagal, diteruskan dengan mengambil catatan dari database
            const query = {
                text: `SELECT notes.* FROM notes
                LEFT JOIN collaborations ON collaborations.note_id = notes.id
                WHERE notes.owner = $1 OR collaborations.user_id = $1
                GROUP BY notes.id`,
                // Pada kueri di atas, kita menggunakan LEFT JOIN karena tabel notes berada di posisi paling kiri (dipanggil pertama kali). Kueri di atas akan mengembalikan seluruh nilai notes yang dimiliki oleh dan dikolaborasikan dengan owner. Data notes yang dihasilkan berpotensi duplikasi, sehingga di akhir kueri, kita GROUP nilainya agar menghilangkan duplikasi yang dilihat berdasarkan notes.id.
                values: [owner],
            };
            const result = await this._pool.query(query);
            
            const mappedResult = result.rows.map(mapDBToModel);

            // Catatan akan disimpan pada cache sebelum fungsi getNotes dikembalikan
            await this._cacheService.set(`notes:${owner}`, JSON.stringify(mappedResult));

            return mappedResult;
        }
    }

    // Untuk proses pengecekan apakah catatan dengan ID yang diminta adalah hak pengguna, menggunakan fungsi baru yaitu verifyNoteOwner. Fungsi tersebut nantinya akan digunakan pada NotesHandler sebelum mendapatkan, mengubah, dan menghapus catatan berdasarkan id.
    async verifyNoteOwner(id, owner) {
        // Kemudian di dalamnya, lakukan kueri untuk mendapatkan objek note sesuai id;
        const query = {
            text: 'SELECT * FROM notes WHERE id = $1',
            values: [id],
        };
        const result = await this._pool.query(query);

        // bila objek note tidak ditemukkan, maka throw NotFoundError
        if (!result.rows.length) {
            throw new NotFoundError('Catatan tidak ditemukan');
        }

        // bila ditemukan, lakukan pengecekan kesesuaian owner-nya;  bila owner tidak sesuai, maka throw AuthorizationError.
        const note = result.rows[0];
        if (note.owner !== owner) {
            throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
        }
    }

    async getNoteById(id) {
        const query = {
            // TODO: Menambahkan properti username pada GET /notes/{id}.
            // Untuk mendapatkan username dari pemilik catatan. Kita harus melakukan join tabel catatan dengan users. Kolom yang menjadi kunci dalam melakukan LEFT JOIN adalah users.id dengan notes.owner. Dengan begitu notes yang dihasilkan dari kueri tersebut akan memiliki properti username
            text: `SELECT notes.*, users.username
            FROM notes
            LEFT JOIN users ON users.id = notes.owner
            WHERE notes.id = $1`,
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
            text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id, owner',
            values: [title, body, tags, updatedAt, id],
        };

        const result = await this._pool.query(query);

        // periksa nilai result.rows bila nilainya 0 (false) maka bangkitkan NotFoundError.
        if (!result.rows.length) {
            throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
        }
        
        // fungsi this._cacheService.delete berfungsi untuk menghapus cache ketika terjadi perubahan data 
        const { owner } = result.rows[0];
        await this._cacheService.delete(`notes:${owner}`);
    }

    async deleteNoteById(id) {
        // Lakukan query untuk menghapus note di dalam database berdasarkan id yang diberikan.
        const query = {
            text: 'DELETE FROM notes WHERE id = $1 RETURNING id, owner',
            values: [id],
        };

        const result = await this._pool.query(query);

        // periksa nilai result.rows bila nilainya 0 (false) maka bangkitkan NotFoundError. 
        if (!result.rows.length) {
            throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
        }

        const { owner } = result.rows[0];
        await this._cacheService.delete(`notes:${owner}`);
    }

    // fungsi ini digunakan untuk bertujuan memverifikasi hak akses pengguna (userId) terhadap catatan (id), baik sebagai owner maupun collaboration. Dalam proses verifikasi, fungsi ini tidak melakukan kueri secara langsung ke database. Melainkan ia memanfaatkan fungsi yang sudah dibuat sebelumnya, yakni verifyNoteOwner dan verifyCollaborator.

    /*
    Tahapannya:
        Fungsi ini akan memeriksa hak akses userId terhadap noteId melalui fungsi verifyNoteOwner.
        Bila userId tersebut merupakan owner dari noteId maka ia akan lolos verifikasi.
        Namun bila gagal, proses verifikasi owner membangkitkan eror (gagal) dan masuk ke block catch.
        Dalam block catch (pertama), error yang dibangkitkan dari fungsi verifyNoteOwner bisa berupa NotFoundError atau AuthorizationError.
        Bila error merupakan NotFoundError, maka langsung throw dengan error (NotFoundError) tersebut. Kita tak perlu memeriksa hak akses kolaborator karena catatannya memang tidak ada.
        Bila AuthorizationError, maka lanjutkan dengan proses pemeriksaan hak akses kolaborator, menggunakan fungsi verifyCollaborator. 
        Bila pengguna seorang kolaborator, proses verifikasi akan lolos.
        Namun jika bukan, maka fungsi verifyNoteAccess gagal dan throw kembali error (AuthorizationError).
     */
    async verifyNoteAccess(noteId, userId) {
        try {
            await this.verifyNoteOwner(noteId, userId);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }

        try {
            await this._collaborationService.verifyCollaborator(noteId, userId);
        } catch {
            throw error;
            }
        }
    }
}

module.exports = NotesService;