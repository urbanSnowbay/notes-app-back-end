/* Berkas ini menampung kode untuk membuat, mengonfigurasi, dan menjalankan HTTP server menggunakan Hapi. */
require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

// notes
const notes = require('./api/notes');
const NotesService = require('./services/postgres/NotesService');
const NotesValidator = require('./validator/notes');

// users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// Exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

const init = async () => {
    // Karena sekarang NotesService memiliki dependency terhadap CollaborationsService, jadi kita harus memberikan instance CollaborationsService ketika membuat instance NotesService. Untuk melakukannya, pindahkan posisi pembuatan instance CollaborationsService, tepat sebelum pembuatan instance NotesService, dan lampirkan instance CollaborationsService ketika membuat instance NotesService.
    const collaborationsService = new CollaborationsService(); 
    const notesService = new NotesService(collaborationsService);
    const usersService = new UsersService();
    const authenticationsService = new AuthenticationsService();

    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST,
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    await server.register([
        {
            plugin: Jwt,
        },
    ]);

    // mendefinisikan strategy autentikasi jwt
    server.auth.strategy('notesapp_jwt', 'jwt', {
        keys: process.env.ACCESS_TOKEN_KEY, // keys: merupakan key atau kunci dari token JWT-nya (di mana merupakan access token key)
        verify: { // verify: merupakan objek yang menentukan seperti apa signature token JWT harus diverifikasi. Di objek ini kita menetapkan:
            aud: false, // aud: nilai audience dari token, bila kita diberi nilai false itu berarti aud tidak akan diverifikasi.
            iss: false, // iss: nilai issuer dari token, bila kita diberi nilai false itu berarti iss tidak akan diverifikasi.
            sub: false, // sub: nilai subject dari token, bila kita diberi nilai false itu berarti sub tidak akan diverifikasi.
            maxAgeSec: process.env.ACCESS_TOKEN_AGE, // maxAgeSec: nilai number yang menentukan umur kedaluwarsa dari token. Penentuan kedaluwarsa token dilihat dari nilai iat yang berada di payload token. 
        },
        validate: (artifacts) => ({ // validate: merupakan fungsi yang membawa artifacts token. Fungsi ini dapat kita manfaatkan untuk menyimpan payload token--yang berarti kredensial pengguna--pada request.auth.
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id,
            },
        }),
    });

    // ubah cara registrasi plugin notes dari objek literals menjadi arrays. Tujuannya, agar kita dapat mendaftarkan lebih dari satu plugin sekaligus.
    await server.register([
        {
            plugin: notes,
            options: {
                service: notesService,
                validator: NotesValidator,
            },
        },
        {
            plugin: users,
            options: {
                service: usersService,
                validator: UsersValidator,
            },
        },
        {
            plugin: authentications,
            options: {
                authenticationsService,
                usersService,
                tokenManager: TokenManager,
                validator: AuthenticationsValidator,
            },
        },
        {
            plugin: collaborations,
            options: {
                collaborationsService,
                notesService,
                validator: CollaborationsValidator,
            },
        },
        {
            plugin: _exports,
            options: {
                service: ProducerService,
                validator: ExportsValidator,
            },
        },
    ]);

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
