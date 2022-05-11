// Menuliskan Authentications Plugin

const AuthenticationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
    name: 'authentications',
    version: '1.0.0',
    register: async (server, {
        authenticationsService,
        usersService,
        tokenManager,
        validator,
    }) => {
        // di dalam fungsi asynchronous register kita buat instance dari authenticationsHandler dan gunakan instance tersebut pada routes konfigurasi
        const authenticationsHandler = new AuthenticationsHandler(
            authenticationsService,
            usersService,
            tokenManager,
            validator,
        );

        server.route(routes(authenticationsHandler));
    },
};