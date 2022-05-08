/* eslint-disable camelcase */

exports.shorthands = undefined;
// migration utama kita tuliskan di dalam fungsi up dan kebutuhan rollback kita tuliskan di dalam fungsi down
exports.up = (pgm) => {
    pgm.createTable('notes', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
        },
        title: {
            type: 'TEXT',
            notNull: true,
        },
        body: {
            type: 'TEXT',
            notNull: true,
        },
        tags: {
            type: 'TEXT[]',
            notNull: true,
        },
        created_at: {
            type: 'TEXT',
            notNull: true,
        },
        updated_at: {
            type: 'TEXT',
            notNull: true,
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable('notes');
};
