/* eslint-disable camelcase */
const mapDBToModel = ({
    id,
    title,
    body,
    tags,
    created_at,
    updated_at,
    // TODO: Menambahkan properti username pada GET /notes/{id}.
    // Agar properti username tampil pada respons, kita perlu menyesuaikan perubahannya pada fungsi mapDBToModel juga.
    username,
}) => ({
    id,
    title,
    body,
    tags,
    createdAt: created_at,
    updatedAt: updated_at,
    // TODO: Menambahkan properti username pada GET /notes/{id}
    // Agar properti username tampil pada respons, kita perlu menyesuaikan perubahannya pada fungsi mapDBToModel juga.
    username,
});

module.exports = { mapDBToModel };