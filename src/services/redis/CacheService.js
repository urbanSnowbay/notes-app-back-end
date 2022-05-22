// file ini berfungsi untuk menampung fungsi yang digunakan untuk mengelola data di cache, seperti SET, GET dan DEL.

const redis = require('redis');

class CacheService {
    constructor() {
        // kita membuat private properti this._client yang bernilai client Redis. Client tersebut dibuat menggunakan perintah createClient yang memanfaatkan package redis. Melalui properti this._client inilah nantinya kita bisa mengoperasikan Redis server.
        this._client = redis.createClient({
            socket: {
                // kita perlu menetapkan nilai host ketika membuat client Redis. Agar nilai host dapat disesuaikan berdasarkan environment, maka kita menyimpannya pada environment variable.
                host: process.env.REDIS_SERVER,
            },
        });

        // pembuatan client Redis bisa saja gagal. Kegagalan tersebut disebabkan oleh banyak faktor, salah satunya adalah tidak tersedianya server Redis pada host yang ditetapkan. Bila eror terjadi, client Redis akan membangkitkan event “error”. Kita bisa memanfaatkan event tersebut untuk melihat penyebab terjadinya eror dengan mencetak error pada console (Terminal).
        this._client.on('error', (error) => {
            console.error(error);
        });

        // agar client redis terhubung dengan redis server, kita perlu memanggil fungsi this._client.connect.
        this._client.connect();
    }

    // fungsi set untuk menyimpan nilai pada cache.
    // kode ini merupakan cara penyimpanan nilai pada Redis menggunakan Redis client, di mana kita menggunakan fungsi this._client.set dan memberikan key, value, serta waktu kedaluwarsa dari nilai parameter fungsi CacheService.set.
    async set(key, value, expirationInSecond = 3600) {
        await this._client.set(key, value, {
            EX: expirationInSecond,
        });
    }

    async get(key) {
        // kode ini merupakan untuk mendapatkan nilai pada key di Redis. Bila di redis-cli kita menggunakan perintah GET, di sini kita menggunakan fungsi asynchronous this._client.get.
        const result = await this._client.get(key);

        // Bila nilai pada key yang diminta tidak ada atau (nil), maka fungsi this._client.get akan mengembalikan null. Di saat itulah kita perlu membangkitkan error karena nilai yang dicari tidak ditemukan.
        if (result === null) throw new Error('Cache tidak ditemukan');

        // Jika nilai pada key ada, maka fungsi this._client.get akan mengembalikan nilai dalam bentuk string.
        return result;
    }

    delete(key) {
        // kode ini merupakan operasi dalam menghapus nilai pada key di Redis. Bila di redis-cli kita menggunakan perintah DEL, di sini kita menggunakan fungsi this._client.del. Fungsi this._client.del mengembalikan jumlah nilai yang dihapus pada cache, nilai tersebut bisa kita manfaatkan sebagai nilai kembalian dari fungsi delete.
        return this._client.del(key);
    }
}

module.exports = CacheService;