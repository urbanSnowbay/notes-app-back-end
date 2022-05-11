// Mengecek apakah refresh token memiliki signature yang sesuai. Proses verifikasi ini bertujuan untuk memastikan refresh token tidak diubah atau dimanipulasi sedemikian rupa untuk mendapatkan akses yang tidak berhak.
const Jwt = require('@hapi/jwt');
const InvariantError = require('../exceptions/InvariantError');

const TokenManager = {
// Parameter payload merupakan objek yang disimpan ke dalam salah satu artifacts JWT. Biasanya objek payload berisi properti yang mengindikasikan identitas pengguna, contohnya user id.
    generateAccessToken: (payload) => Jwt.token.generate(payload, process.env.ACCESS_TOKEN_KEY),
        // Fungsi generate menerima dua parameter, yang pertama adalah payload dan kedua adalah secretKey. Pada parameter payload, kita akan memberikan nilai payload yang ada di parameter fungsi. Kemudian secretKey, sesuai namanya ia adalah kunci yang digunakan algoritma enkripsi sebagai kombinasi untuk membuat JWT token. Kunci ini bersifat rahasia, jadi jangan disimpan di source code secara transparan. Kita akan simpan key di dalam environment variable ACCESS_TOKEN_KEY.

    generateRefreshToken: (payload) => Jwt.token.generate(payload, process.env.REFRESH_TOKEN_KEY),
    
    verifyRefreshToken: (refreshToken) => {
        // Untuk men-decoded token, gunakan fungsi Jwt.token.decode dan fungsi tersebut akan mengembalikan artifacts.
        // *artifacts = token yang sudah di-decoded
        try {
            const artifacts = Jwt.token.decode(refreshToken);
        // Setelah artifacts didapatkan, barulah kita bisa melakukan verifikasi. Silakan panggil fungsi Jwt.token.verifySignature dengan memberikan artifacts dan process.env.REFRESH_TOKEN_KEY sebagai nilai parameternya. Fungsi verifySignature ini akan mengecek apakah refresh token memiliki signature yang sesuai atau tidak. Jika hasil verifikasi sesuai, fungsi ini akan lolos. Namun bila tidak, maka fungsi ini akan membangkitkan eror.
            Jwt.token.verifySignature(artifacts, process.env.REFRESH_TOKEN_KEY);

            // Buat variabel payload yang bernilai artifacts.decoded , kemudian kembalikan nilai payload. Nilai payload nantinya akan digunakan untuk membuat akses token baru.
            const { payload } = artifacts.decoded;
            return payload;
        } catch (error) {
            throw new InvariantError('Refresh token tidak valid');
        }
    },
};

module.exports = TokenManager;
