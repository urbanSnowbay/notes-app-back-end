const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
    constructor() {
        this._pool = new Pool();
    }

    async addUser({ username, password, fullname }) {
        // TODO: Verifikasi username, pastikan belum terdaftar
        await this.verifyNewUsername(username); // OK
        // TODO: Bila verifikasi berhasil, maka masukkan user baru ke database
        const id = `user-${nanoid(16)}`; // OK

        // Best practice dalam menyimpan password di database adalah dengan men-hashing password-nya. Untuk proses hash itu sendiri, kita akan gunakan package bernama bcrypt. Fungsi bcrypt.hash menerima dua parameter, yakni data dan saltRounds. Parameter data merupakan nilai yang ingin di-hash, pada kasus ini adalah 'password' yang diberikan oleh client. Sedangkan parameter saltRounds merupakan sebuah angka yang digunakan oleh algoritma bcrypt untuk menciptakan nilai string yang tidak dapat diprediksi. Nilai 10 merupakan standar dari saltRounds.
        // Fungsi bcrypt.hash akan mengembalikan nilai string yang merupakan hasil dari proses hash (hashedPassword). Nah, nilai inilah yang akan kita masukkan ke database sebagai password.
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = {
            text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
            values: [id, username, hashedPassword, fullname],
        };
        const result = await this._pool.query(query);

        // Evaluasi nilai result.rows.length. Bila ia memiliki nilai 0, itu berarti proses memasukkan user baru gagal dijalankan (karena result.rows tidak menghasilkan user id baru). Nah, bila ini terjadi, bangkitkan InvariantError dengan pesan “User gagal ditambahkan”.
        if (!result.rows.length) {
            throw new InvariantError('User gagal ditambahkan');
        }
        // Kembalikan nilai addUser dengan result.rows[0].id. Mengapa? Karena kita akan membutuhkan id pada proses pengujian, lebih tepatnya untuk mengisi nilai variabel currentUserId.
        return result.rows[0].id;
    }

    // Kemudian di dalamnya, lakukan kueri username dari tabel users berdasarkan nilai username yang diberikan pada parameter.
    async verifyNewUsername(username) {
        const query = {
            text: 'SELECT username FROM users WHERE username = $1',
            values: [username],
        };
        const result = await this._pool.query(query);

        // Jika result.rows.length menghasilkan nilai lebih dari 0, itu berarti username sudah ada di database. Pada saat ini terjadi, kita perlu membangkitkan error untuk memberitahu bahwa verifikasi username baru gagal.
        if (result.rows.length > 0) {
            throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
        }
    }

    async getUserById(userId) {
        const query = {
            text: 'SELECT id, username, fullname FROM users WHERE id = $1',
            values: [userId],
        };
        const result = await this._pool.query(query);

        // Evaluasi nilai result.rows.length. Bila nilainya 0, itu berarti user dengan id yang diminta tidak ditemukan. Bila ini terjadi, throw new NotFoundError dengan pesan ‘User tidak ditemukan’ (sesuai dengan skenario uji Getting User by Incorrect Id).
        if (!result.rows.length) {
            throw new NotFoundError('User tidak ditemukan');
        }
        // Kembalikan fungsi getUserById dengan nilai user yang didapat pada result.rows[0].
        return result.rows[0];
    }

    async verifyUserCredential(username, password) {
        const query = {
            text: 'SELECT id, password FROM users WHERE username = $1',
            values: [username],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new AuthenticationError('Kredensial yang Anda berikan salah');
        }

        // Selanjutnya (jika result.rows.length tidak kosong), dapatkan id dan password dari result.rows[0]. Untuk nilai password, kita tampung ke variabel hashedPassword ya biar tidak ambigu dengan variabel password di parameter.
        const { id, password: hashedPassword } = result.rows[0];

        // Untuk melakukan komparasi nilai string plain dan hashed menggunakan bcrypt, kita dapat memanfaatkan fungsi bcrypt.compare. Fungsi tersebut akan mengembalikan Promise boolean yang akan bernilai true bila nilai komparasi sesuai dan false bila nilai komparasi tidak sesuai. Dari nilai boolean tersebut, kita bisa mengetahui apakah password yang dikirim benar atau tidak.
        const match = await bcrypt.compare(password, hashedPassword);

        // Sekarang kita bisa evaluasi variabel match, jika hasilnya false, bangkitkan eror AuthenticationError dengan pesan ‘Kredensial yang Anda berikan salah’. Jika hasilnya true, kembalikan dengan nilai id user.
        if (!match) {
            throw new AuthenticationError('Kredensial yang Anda berikan salah');
        }
        return id;
        // Nilai user id tersebut nantinya akan digunakan dalam membuat access token dan refresh token.
    }
}

module.exports = UsersService;