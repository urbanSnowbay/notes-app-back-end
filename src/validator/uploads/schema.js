const Joi = require('joi');

const ImageHeadersSchema = Joi.object({
    // Valid merupakan variadic function yang digunakan untuk menentukan validitas nilai properti berdasarkan nilai secara spesifik. Nilai tersebut dapat ditetapkan pada parameter fungsi ini. Jika nilai properti content-type termasuk ke dalam nilai tersebut, maka validasi berhasil.
    'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp').required(),
}).unknown();
// Unknown merupakan fungsi untuk membuat objek bersifat tidak diketahui. Artinya, objek boleh memiliki properti apa pun karena memang kita tidak tahu objek dapat memiliki properti apa saja. Pada contoh kode di atas, itu berarti objek dapat memiliki properti apa pun selama terdapat properti content-type karena properti tersebut ditandai dengan required.

module.exports = { ImageHeadersSchema };